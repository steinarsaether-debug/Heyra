import {
  CancellationPolicy,
  ListingType,
  ListingStatus,
  PricingModel,
  PropertyStatus,
  SharedApprovalStatus,
  Species,
  TerrainType,
  ListingGovernanceModel,
} from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { canManageProperties } from "@/lib/access";
import { normalizeListingAvailability } from "@/lib/listing-availability";
import { getPropertyBoundaryStatus } from "@/lib/property-boundary-status";
import { prisma } from "@/lib/prisma";
import { listingDraftSchema, listingQuotaSchema, listingRulesSchema } from "@/lib/listing-schema";
import { buildListingSlug } from "@/lib/listing-view";

export const runtime = "nodejs";

function normalizeListingQuota(quota: unknown) {
  return listingQuotaSchema.parse(quota ?? {});
}

function normalizeListingRules(rules: unknown) {
  return listingRulesSchema.parse(rules ?? {});
}

async function buildUniqueSlug(title: string, listingId?: string) {
  const base = buildListingSlug(title, listingId);
  let candidate = base;
  let suffix = 2;

  while (true) {
    const existing = await prisma.listing.findFirst({
      where: {
        slug: candidate,
        ...(listingId
          ? {
              NOT: {
                id: listingId,
              },
            }
          : {}),
      },
      select: {
        id: true,
      },
    });

    if (!existing) {
      return candidate;
    }

    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();

  if (!canManageProperties(session)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { id } = await context.params;

  const property = await prisma.property.findFirst({
    where: {
      id,
      ownerId: session.user.id,
    },
    include: {
      vald: true,
      listings: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
    },
  });

  if (!property) {
    return NextResponse.json({ error: "Property not found." }, { status: 404 });
  }

  const hasBoundary = await getPropertyBoundaryStatus(property.id, session.user.id);

  return NextResponse.json({
    property: {
      id: property.id,
      cadastralRef: property.cadastralRef,
      municipality: property.municipality,
      county: property.county,
      status: property.status,
      hasBoundary,
      vald: property.vald,
    },
    listing: property.listings[0]
      ? {
          ...property.listings[0],
          quota: normalizeListingQuota(property.listings[0].quota),
          rules: normalizeListingRules(property.listings[0].rules),
          availabilityCalendar: normalizeListingAvailability(property.listings[0].availabilityCalendar),
        }
      : null,
  });
}

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();

  if (!canManageProperties(session)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { id } = await context.params;

  const property = await prisma.property.findFirst({
    where: {
      id,
      ownerId: session.user.id,
    },
    include: {
      vald: true,
      listings: {
        take: 1,
      },
    },
  });

  if (!property) {
    return NextResponse.json({ error: "Property not found." }, { status: 404 });
  }

  if (property.listings[0]) {
    return NextResponse.json(
      { ok: true, listingId: property.listings[0].id },
      { status: 200 },
    );
  }

  const slug = await buildUniqueSlug(`${property.municipality} ${property.cadastralRef}`, id);

  const listing = await prisma.listing.create({
    data: {
      propertyId: property.id,
      slug,
      type: property.terrainTypes.includes(TerrainType.COASTAL)
        ? ListingType.FISHING
        : ListingType.HUNTING,
      title: `${property.municipality} ${property.cadastralRef}`,
      description:
        "Describe the terrain, access, species, practical arrangements, and the kind of hunting or fishing experience you want to offer here.",
      species: property.terrainTypes.includes(TerrainType.COASTAL)
        ? [Species.LAKS]
        : [Species.ELG],
      valdId: property.valdId,
      governanceModel: property.valdId
        ? ListingGovernanceModel.VALD_MANAGED
        : ListingGovernanceModel.INDIVIDUAL_PROPERTY,
      geometryConfidence: property.geometryConfidence,
      rightsConfidence: property.rightsConfidence,
      governanceConfidence: property.governanceConfidence,
      boundaryIsApproximate: property.boundaryIsApproximate,
      rightsDifferFromBoundary: property.rightsDifferFromBoundary,
      representativeConfirmationStatus:
        property.vald?.representativeConfirmationStatus ?? SharedApprovalStatus.NOT_REQUESTED,
      coApprovalRequired: Boolean(property.vald?.coApprovalRequired),
      governanceNotes: property.vald
        ? `This property sits inside ${property.vald.name}. Confirm how quota, approvals, and access are coordinated before publishing.`
        : null,
      governanceEvidenceNotes: null,
      municipalityProcessNotes: null,
      pricingModel: PricingModel.PER_DAY,
      priceNok: 2500,
      maxGroupSize: 2,
      minNights: 1,
      instantBookEnabled: property.terrainTypes.includes(TerrainType.COASTAL),
      cancellationPolicy: CancellationPolicy.MODERATE,
      availabilityCalendar: {},
      quota: {
        summary: "",
        availabilitySummary: property.vald
          ? "Availability should be confirmed against the shared vald quota before each trip."
          : "",
        permitNotes: property.vald
          ? `Permits and local allocation should be confirmed with ${property.vald.name}.`
          : "",
        reportingNotes: "",
        reportingResponsibility: property.vald
          ? `Agree whether the hunter, landowner, or vald representative files the final reporting.`
          : "",
      },
      rules: {
        speciesRestrictions: "",
        gearRules: "",
        bagLimitNotes: "",
        areaNotes: "",
        requiresNationalFishingLicense: property.terrainTypes.includes(TerrainType.COASTAL),
      },
      photos: [],
      status: ListingStatus.DRAFT,
    },
    select: {
      id: true,
    },
  });

  return NextResponse.json({ ok: true, listingId: listing.id }, { status: 201 });
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();

  if (!canManageProperties(session)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { id } = await context.params;

  try {
    const json = await request.json();
    const parsed = listingDraftSchema.safeParse(json);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid listing payload.";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const property = await prisma.property.findFirst({
      where: {
        id,
        ownerId: session.user.id,
      },
    include: {
        vald: true,
        listings: {
          take: 1,
        },
      },
    });

    if (!property) {
      return NextResponse.json({ error: "Property not found." }, { status: 404 });
    }

    const data = parsed.data;
    const existing = property.listings[0] ?? null;
    const slug = await buildUniqueSlug(data.title, existing?.id ?? property.id);

    const listing = existing
      ? await prisma.listing.update({
          where: {
            id: existing.id,
          },
          data: {
            slug,
            type: data.type,
            valdId:
              data.governanceModel === ListingGovernanceModel.VALD_MANAGED
                ? property.valdId
                : null,
            governanceModel: data.governanceModel,
            geometryConfidence: property.geometryConfidence,
            rightsConfidence: property.rightsConfidence,
            governanceConfidence: property.governanceConfidence,
            boundaryIsApproximate: property.boundaryIsApproximate,
            rightsDifferFromBoundary: property.rightsDifferFromBoundary,
            representativeConfirmationStatus:
              property.vald?.representativeConfirmationStatus ?? SharedApprovalStatus.NOT_REQUESTED,
            coApprovalRequired: data.coApprovalRequired,
            governanceNotes: data.governanceNotes || null,
            governanceEvidenceNotes: data.governanceEvidenceNotes || null,
            municipalityProcessNotes: data.municipalityProcessNotes || null,
            title: data.title,
            description: data.description,
            species: data.species,
            pricingModel: data.pricingModel,
            priceNok: data.priceNok,
            maxGroupSize: data.maxGroupSize,
            minNights: data.minNights,
            instantBookEnabled: data.instantBookEnabled,
            cancellationPolicy: data.cancellationPolicy,
            photos: data.photoUrls,
            quota: data.quota,
            rules: data.rules,
            availabilityCalendar: data.availability,
          },
          select: {
            id: true,
            slug: true,
            status: true,
            governanceModel: true,
            coApprovalRequired: true,
            governanceNotes: true,
            governanceEvidenceNotes: true,
            municipalityProcessNotes: true,
            quota: true,
          },
        })
      : await prisma.listing.create({
          data: {
            propertyId: property.id,
            slug,
            type: data.type,
            valdId:
              data.governanceModel === ListingGovernanceModel.VALD_MANAGED
                ? property.valdId
                : null,
            governanceModel: data.governanceModel,
            geometryConfidence: property.geometryConfidence,
            rightsConfidence: property.rightsConfidence,
            governanceConfidence: property.governanceConfidence,
            boundaryIsApproximate: property.boundaryIsApproximate,
            rightsDifferFromBoundary: property.rightsDifferFromBoundary,
            representativeConfirmationStatus:
              property.vald?.representativeConfirmationStatus ?? SharedApprovalStatus.NOT_REQUESTED,
            coApprovalRequired: data.coApprovalRequired,
            governanceNotes: data.governanceNotes || null,
            governanceEvidenceNotes: data.governanceEvidenceNotes || null,
            municipalityProcessNotes: data.municipalityProcessNotes || null,
            title: data.title,
            description: data.description,
            species: data.species,
            pricingModel: data.pricingModel,
            priceNok: data.priceNok,
            maxGroupSize: data.maxGroupSize,
            minNights: data.minNights,
            instantBookEnabled: data.instantBookEnabled,
            cancellationPolicy: data.cancellationPolicy,
            availabilityCalendar: data.availability,
            quota: data.quota,
            rules: data.rules,
            photos: data.photoUrls,
            status: ListingStatus.DRAFT,
          },
          select: {
            id: true,
            slug: true,
            status: true,
            governanceModel: true,
            coApprovalRequired: true,
            governanceNotes: true,
            governanceEvidenceNotes: true,
            municipalityProcessNotes: true,
            quota: true,
          },
        });

    if (property.status === PropertyStatus.DRAFT) {
      await prisma.property.update({
        where: {
          id: property.id,
        },
        data: {
          status: PropertyStatus.PENDING_REVIEW,
        },
      });
    }

    return NextResponse.json(
      {
        ok: true,
        listing: {
          ...listing,
          quota: normalizeListingQuota(listing.quota),
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Listing save failed", error);
    return NextResponse.json(
      { error: "Something went wrong while saving the listing." },
      { status: 500 },
    );
  }
}
