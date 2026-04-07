import {
  BookingFlowType,
  BookingStatus,
  ListingGovernanceModel,
  ListingType,
  PricingModel,
  UserRole,
} from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { hasRole } from "@/lib/access";
import { buildContractDocumentNumber, buildContractHtml, LEGAL_TERMS_VERSION } from "@/lib/commerce";
import { getBookingNights, bookingRequestSchema } from "@/lib/booking-schema";
import { isDateRangeBlocked, normalizeListingAvailability } from "@/lib/listing-availability";
import { queueNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();

  if (!session?.user || !hasRole(session, [UserRole.HUNTER])) {
    return NextResponse.json({ error: "Only hunters can create booking requests." }, { status: 403 });
  }

  const { id } = await context.params;

  try {
    const json = await request.json();
    const parsed = bookingRequestSchema.safeParse(json);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid booking request.";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const listing = await prisma.listing.findFirst({
      where: {
        id,
        status: "PUBLISHED",
      },
      include: {
        property: {
          select: {
            cadastralRef: true,
            municipality: true,
            county: true,
            ownerId: true,
            owner: {
              select: {
                email: true,
                pii: {
                  select: {
                    fullName: true,
                  },
                },
              },
            },
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

    if (listing.property.ownerId === session.user.id) {
      return NextResponse.json({ error: "You cannot book your own listing." }, { status: 400 });
    }

    const hunter = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        emailVerified: true,
      },
    });

    if (!hunter?.emailVerified) {
      return NextResponse.json(
        { error: "Verify your email before you send booking requests." },
        { status: 403 },
      );
    }

    if (listing.type === ListingType.HUNTING && !parsed.data.attestedHunterFee) {
      return NextResponse.json(
        { error: "Confirm that your hunter fee is valid before sending a hunting request." },
        { status: 400 },
      );
    }

    const listingRules = (listing.rules as
      | { requiresNationalFishingLicense?: boolean }
      | null) ?? { };

    if (listing.type === ListingType.FISHING && !parsed.data.attestedFishingRules) {
      return NextResponse.json(
        { error: "Confirm that you have read the fishing rules before continuing." },
        { status: 400 },
      );
    }

    if (
      listing.type === ListingType.FISHING &&
      listingRules.requiresNationalFishingLicense &&
      !parsed.data.attestedHunterFee
    ) {
      return NextResponse.json(
        { error: "Confirm the required national fishing fee before continuing." },
        { status: 400 },
      );
    }

    const startDate = new Date(parsed.data.startDate);
    const endDate = new Date(parsed.data.endDate);
    const nights = getBookingNights(startDate, endDate);
    const availability = normalizeListingAvailability(listing.availabilityCalendar);

    if (listing.minNights && nights < listing.minNights) {
      return NextResponse.json(
        { error: `This listing requires at least ${listing.minNights} day${listing.minNights === 1 ? "" : "s"}.` },
        { status: 400 },
      );
    }

    if (startDate < new Date(new Date().toDateString())) {
      return NextResponse.json(
        { error: "Booking requests must start today or later." },
        { status: 400 },
      );
    }

    if (isDateRangeBlocked(availability, startDate, endDate)) {
      return NextResponse.json(
        { error: "Those dates fall inside a blocked period for this listing." },
        { status: 409 },
      );
    }

    const totalNok =
      listing.pricingModel === PricingModel.PER_DAY ? listing.priceNok * nights : listing.priceNok;
    const platformFeeNok = Math.round(totalNok * 0.08);
    const payoutNok = totalNok - platformFeeNok;

    const overlap = await prisma.booking.findFirst({
      where: {
        listingId: listing.id,
        status: {
          in: [
            BookingStatus.REQUESTED,
            BookingStatus.SHARED_CONFIRMATION_PENDING,
            BookingStatus.APPROVED,
            BookingStatus.CONFIRMED,
            BookingStatus.ACTIVE,
          ],
        },
        AND: [
          {
            startDate: {
              lte: endDate,
            },
          },
          {
            endDate: {
              gte: startDate,
            },
          },
        ],
      },
      select: {
        id: true,
      },
    });

    if (overlap) {
      return NextResponse.json(
        { error: "Those dates already overlap an active booking or request." },
        { status: 409 },
      );
    }

    const duplicatePendingRequest = await prisma.booking.findFirst({
      where: {
        listingId: listing.id,
        hunterId: session.user.id,
        status: {
          in: [
            BookingStatus.REQUESTED,
            BookingStatus.SHARED_CONFIRMATION_PENDING,
            BookingStatus.APPROVED,
          ],
        },
      },
      select: {
        id: true,
      },
    });

    if (duplicatePendingRequest) {
      return NextResponse.json(
        { error: "You already have an open request on this listing." },
        { status: 409 },
      );
    }

    const isInstantFishing = listing.type === ListingType.FISHING && listing.instantBookEnabled;
    const booking = await prisma.$transaction(async (tx) => {
      const created = await tx.booking.create({
        data: {
          listingId: listing.id,
          hunterId: session.user.id,
          startDate,
          endDate,
          flowType: isInstantFishing ? BookingFlowType.INSTANT_FISHING : BookingFlowType.REQUEST,
          requestMessage: parsed.data.requestMessage,
          hunterAttestations: {
            attestedHunterFee: Boolean(parsed.data.attestedHunterFee),
            attestedFishingRules: Boolean(parsed.data.attestedFishingRules),
            participantCount: parsed.data.participantCount ?? 1,
            attribution:
              parsed.data.firstTouchShareSource ||
              parsed.data.firstTouchShareCampaign ||
              parsed.data.lastTouchShareSource ||
              parsed.data.lastTouchShareCampaign ||
              parsed.data.shareSource ||
              parsed.data.shareCampaign
                ? {
                    firstTouchSource:
                      parsed.data.firstTouchShareSource ?? parsed.data.shareSource ?? null,
                    firstTouchCampaign:
                      parsed.data.firstTouchShareCampaign ?? parsed.data.shareCampaign ?? null,
                    lastTouchSource:
                      parsed.data.lastTouchShareSource ?? parsed.data.shareSource ?? null,
                    lastTouchCampaign:
                      parsed.data.lastTouchShareCampaign ?? parsed.data.shareCampaign ?? null,
                  }
                : null,
          },
          status: isInstantFishing ? BookingStatus.CONTRACT_PENDING : BookingStatus.REQUESTED,
          totalNok,
          platformFeeNok,
          payoutNok,
        },
        select: {
          id: true,
          status: true,
        },
      });

      if (isInstantFishing) {
        await tx.contract.create({
          data: {
            bookingId: created.id,
            documentNumber: buildContractDocumentNumber(created.id),
            contentHtml: buildContractHtml({
              documentNumber: buildContractDocumentNumber(created.id),
              listingTitle: listing.title,
              flowType: BookingFlowType.INSTANT_FISHING,
              hunterName: session.user.fullName,
              hunterEmail: session.user.email ?? "hunter@heyra.local",
              landownerName: listing.property.owner.pii?.fullName ?? listing.property.owner.email,
              landownerEmail: listing.property.owner.email,
              cadastralRef: listing.property.cadastralRef,
              municipality: listing.property.municipality,
              county: listing.property.county,
              startDate,
              endDate,
              totalNok,
              cancellationPolicy: listing.cancellationPolicy,
              requestMessage: parsed.data.requestMessage,
              governanceNotes: listing.governanceNotes,
            }),
            termsVersion: LEGAL_TERMS_VERSION,
            status: "PENDING_SIGNATURE",
            lastSentAt: new Date(),
          },
        });

        await queueNotification(tx, {
          bookingId: created.id,
          userId: session.user.id,
          template: "instant-fishing-contract",
          subject: `Fishing checkout started for ${listing.title}`,
          body: "Sign the contract and authorize payment to finish this instant fishing booking.",
          markSent: true,
        });
      } else {
        await queueNotification(tx, {
          bookingId: created.id,
          userId: listing.property.ownerId,
          template: "booking-request",
          subject: `New booking request for ${listing.title}`,
          body: `${session.user.fullName} has sent a booking request for ${startDate.toLocaleDateString("nb-NO")} to ${endDate.toLocaleDateString("nb-NO")}.`,
          markSent: true,
        });
      }

      return created;
    });

    const message =
      isInstantFishing
        ? "Instant fishing checkout started. Sign the contract and authorize payment to lock in the licence."
        : listing.coApprovalRequired || listing.governanceModel === ListingGovernanceModel.VALD_MANAGED
        ? `Booking request sent. Final confirmation may require ${listing.property.vald?.name ?? "shared hunting area"} approval before dates and quota are locked.`
        : "Booking request sent to the landowner.";

    return NextResponse.json({ ok: true, booking, message }, { status: 201 });
  } catch (error) {
    console.error("Booking request failed", error);
    return NextResponse.json(
      { error: "Something went wrong while creating the booking request." },
      { status: 500 },
    );
  }
}
