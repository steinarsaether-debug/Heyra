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
import { canManageProperties, getOperationalAccessError, isSignedIn } from "@/lib/access";
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
    return NextResponse.json(
      { error: getOperationalAccessError(session, "eiendom") },
      { status: isSignedIn(session) ? 403 : 401 },
    );
  }

  const { id } = await context.params;

  const property = await prisma.property.findFirst({
    where: {
      id,
      ownerId: session.user.id,
    },
    include: {
      vald: true,
      rightsOverlays: {
        orderBy: [
          { visibility: "asc" },
          { title: "asc" },
        ],
        select: {
          id: true,
          title: true,
          overlayType: true,
          visibility: true,
        },
      },
      listings: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
    },
  });

  if (!property) {
    return NextResponse.json({ error: "Fant ikke eiendommen." }, { status: 404 });
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
      rightsOverlays: property.rightsOverlays,
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
    return NextResponse.json(
      { error: getOperationalAccessError(session, "eiendom") },
      { status: isSignedIn(session) ? 403 : 401 },
    );
  }

  const { id } = await context.params;

  const property = await prisma.property.findFirst({
    where: {
      id,
      ownerId: session.user.id,
    },
    include: {
      vald: true,
      rightsOverlays: {
        select: {
          id: true,
        },
      },
      listings: {
        take: 1,
      },
    },
  });

  if (!property) {
    return NextResponse.json({ error: "Fant ikke eiendommen." }, { status: 404 });
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
        "Beskriv terrenget, adkomsten, artene, de praktiske rammene og hvilken jakt- eller fiskeopplevelse du vil tilby her.",
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
        ? `Denne eiendommen ligger i ${property.vald.name}. Bekreft hvordan kvote, godkjenninger og tilgang samordnes før publisering.`
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
          ? "Tilgjengelighet bør bekreftes mot felles vald-kvote før hver tur."
          : "",
        permitNotes: property.vald
          ? `Tillatelser og lokal fordeling bør bekreftes med ${property.vald.name}.`
          : "",
        reportingNotes: "",
        reportingResponsibility: property.vald
          ? "Avklar om det er jeger, grunneier eller valdansvarlig som sender inn endelig rapportering."
          : "",
      },
      rules: {
        speciesRestrictions: "",
        gearRules: "",
        bagLimitNotes: "",
        areaNotes: "",
        requiresNationalFishingLicense: property.terrainTypes.includes(TerrainType.COASTAL),
        publicRightsOverlayId: null,
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
    return NextResponse.json(
      { error: getOperationalAccessError(session, "eiendom") },
      { status: isSignedIn(session) ? 403 : 401 },
    );
  }

  const { id } = await context.params;

  try {
    const json = await request.json();
    const parsed = listingDraftSchema.safeParse(json);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Ugyldige opplysninger for annonsen.";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const property = await prisma.property.findFirst({
      where: {
        id,
        ownerId: session.user.id,
      },
      include: {
        vald: true,
        rightsOverlays: {
          select: {
            id: true,
          },
        },
        listings: {
          take: 1,
        },
      },
    });

    if (!property) {
      return NextResponse.json({ error: "Fant ikke eiendommen." }, { status: 404 });
    }

    const data = parsed.data;
    const publicRightsOverlayId = data.rules.publicRightsOverlayId;

    if (
      publicRightsOverlayId &&
      !property.rightsOverlays.some((overlay) => overlay.id === publicRightsOverlayId)
    ) {
      return NextResponse.json(
        { error: "Fant ikke valgt offentlig rettighetslag på denne eiendommen." },
        { status: 400 },
      );
    }

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
      { error: "Noe gikk galt da annonsen skulle lagres." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();

  if (!canManageProperties(session)) {
    return NextResponse.json(
      { error: getOperationalAccessError(session, "eiendom") },
      { status: isSignedIn(session) ? 403 : 401 },
    );
  }

  const { id } = await context.params;

  const property = await prisma.property.findFirst({
    where: {
      id,
      ownerId: session.user.id,
    },
    include: {
      listings: {
        take: 1,
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          bookings: {
            select: {
              id: true,
            },
            take: 1,
          },
        },
      },
    },
  });

  if (!property) {
    return NextResponse.json({ error: "Fant ikke eiendommen." }, { status: 404 });
  }

  const listing = property.listings[0];

  if (!listing) {
    return NextResponse.json({ error: "Fant ikke annonsen." }, { status: 404 });
  }

  if (listing.bookings.length > 0) {
    return NextResponse.json(
      {
        error:
          "Denne annonsen har allerede bestillingshistorikk. Arkiver den i stedet for å slette den.",
      },
      { status: 400 },
    );
  }

  await prisma.listing.delete({
    where: {
      id: listing.id,
    },
  });

  return NextResponse.json({ ok: true });
}
