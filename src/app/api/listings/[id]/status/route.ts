import { ListingGovernanceModel, ListingStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { canManageProperties, canReviewListings } from "@/lib/access";
import {
  dismissComplianceTasksForListing,
  syncComplianceTasksForListing,
} from "@/lib/compliance";
import { prisma } from "@/lib/prisma";
import { listingStatusActionSchema } from "@/lib/listing-schema";
import { getBigGameGovernanceReadiness } from "@/lib/listing-view";

export const runtime = "nodejs";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const json = await request.json();
    const parsed = listingStatusActionSchema.safeParse(json);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid listing action.";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const listing = await prisma.listing.findUnique({
      where: {
        id,
      },
      include: {
        property: {
          select: {
            ownerId: true,
            valdId: true,
            municipality: true,
            county: true,
            vald: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!listing) {
      return NextResponse.json({ error: "Listing not found." }, { status: 404 });
    }

    const isOwner = listing.property.ownerId === session.user.id;
    const action = parsed.data.action;

    if (action === "submit_for_review") {
      if (!isOwner || !canManageProperties(session)) {
        return NextResponse.json({ error: "Forbidden." }, { status: 403 });
      }

      const owner = await prisma.user.findUnique({
        where: {
          id: session.user.id,
        },
        select: {
          emailVerified: true,
        },
      });

      if (!owner?.emailVerified) {
        return NextResponse.json(
          { error: "Verify your email before submitting a listing for review." },
          { status: 403 },
        );
      }

      if (listing.species.length === 0) {
        return NextResponse.json(
          { error: "Choose at least one species before submitting a listing for review." },
          { status: 400 },
        );
      }

      const includesBigGame = listing.species.some((species) =>
        ["ELG", "HJORT", "RADYR", "VILLREIN"].includes(species),
      );

      if (includesBigGame && (listing.governanceNotes ?? "").trim().length < 20) {
        return NextResponse.json(
          {
            error:
              "Add clear approval notes for big-game listings so hunters understand who confirms access, quotas, and dates.",
          },
          { status: 400 },
        );
      }

      const quota = (listing.quota as
        | {
            summary?: string;
            availabilitySummary?: string;
            permitNotes?: string;
            reportingNotes?: string;
            reportingResponsibility?: string;
          }
        | null) ?? { };
      const rules = (listing.rules as
        | { gearRules?: string; bagLimitNotes?: string; areaNotes?: string }
        | null) ?? { };

      if (includesBigGame && !quota.summary?.trim() && !quota.permitNotes?.trim()) {
        return NextResponse.json(
          {
            error:
              "Add quota or permit guidance for big-game listings so hunters know what is actually included before review.",
          },
          { status: 400 },
        );
      }

      const governanceReadiness = getBigGameGovernanceReadiness({
        governanceNotes: listing.governanceNotes,
        quota,
        governanceModel: listing.governanceModel,
        hasVald: Boolean(listing.property.valdId),
      });

      if (includesBigGame && !governanceReadiness.ready) {
        return NextResponse.json(
          {
            error: governanceReadiness.issues[0] ?? "The big-game listing still needs clearer shared-governance context.",
          },
          { status: 400 },
        );
      }

      if (includesBigGame && listing.property.valdId && listing.governanceModel !== ListingGovernanceModel.VALD_MANAGED) {
        return NextResponse.json(
          {
            error:
              `This property is attached to a vald in ${listing.property.municipality}, ${listing.property.county}. Mark the listing as vald managed before review.`,
          },
          { status: 400 },
        );
      }

      if (
        listing.type === "FISHING" &&
        listing.instantBookEnabled &&
        !rules.gearRules?.trim() &&
        !rules.areaNotes?.trim() &&
        !rules.bagLimitNotes?.trim()
      ) {
        return NextResponse.json(
          {
            error:
              "Instant fishing offers need clear rules or area notes before review so buyers understand the valid water and restrictions.",
          },
          { status: 400 },
        );
      }

      const updated = await prisma.listing.update({
        where: {
          id,
        },
        data: {
          status: ListingStatus.PENDING_REVIEW,
          reviewerNotes: null,
          reviewedAt: null,
        },
        select: {
          id: true,
          status: true,
        },
      });

      return NextResponse.json({ ok: true, listing: updated });
    }

    if (action === "save_draft" || action === "revert_to_draft") {
      const canRevert = isOwner || canReviewListings(session);

      if (!canRevert) {
        return NextResponse.json({ error: "Forbidden." }, { status: 403 });
      }

      const updated = await prisma.$transaction(async (tx) => {
        const nextListing = await tx.listing.update({
          where: {
            id,
          },
          data: {
            status: ListingStatus.DRAFT,
            reviewerNotes: canReviewListings(session) ? parsed.data.reviewerNotes?.trim() || null : undefined,
            reviewedAt: canReviewListings(session) ? new Date() : undefined,
          },
          select: {
            id: true,
            status: true,
          },
        });

        await dismissComplianceTasksForListing(tx, id);

        return nextListing;
      });

      return NextResponse.json({ ok: true, listing: updated });
    }

    if (action === "publish") {
      if (!canReviewListings(session)) {
        return NextResponse.json({ error: "Forbidden." }, { status: 403 });
      }

      const updated = await prisma.$transaction(async (tx) => {
        const nextListing = await tx.listing.update({
          where: {
            id,
          },
          data: {
            status: ListingStatus.PUBLISHED,
            reviewerNotes: parsed.data.reviewerNotes?.trim() || null,
            reviewedAt: new Date(),
          },
          select: {
            id: true,
            status: true,
            slug: true,
          },
        });

        await syncComplianceTasksForListing(tx, id);

        return nextListing;
      });

      return NextResponse.json({ ok: true, listing: updated });
    }

    if (action === "archive") {
      const canArchive = isOwner || canReviewListings(session);

      if (!canArchive) {
        return NextResponse.json({ error: "Forbidden." }, { status: 403 });
      }

      const updated = await prisma.$transaction(async (tx) => {
        const nextListing = await tx.listing.update({
          where: {
            id,
          },
          data: {
            status: ListingStatus.ARCHIVED,
            reviewerNotes: canReviewListings(session) ? parsed.data.reviewerNotes?.trim() || null : undefined,
            reviewedAt: canReviewListings(session) ? new Date() : undefined,
          },
          select: {
            id: true,
            status: true,
          },
        });

        await dismissComplianceTasksForListing(tx, id);

        return nextListing;
      });

      return NextResponse.json({ ok: true, listing: updated });
    }

    return NextResponse.json({ error: "Unsupported listing action." }, { status: 400 });
  } catch (error) {
    console.error("Listing status update failed", error);
    return NextResponse.json(
      { error: "Something went wrong while changing the listing status." },
      { status: 500 },
    );
  }
}
