import {
  BookingStatus,
  ContractStatus,
  ListingGovernanceModel,
  PaymentProvider,
  PaymentStatus,
  Prisma,
  PrismaClient,
} from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { bookingStatusSchema } from "@/lib/booking-schema";
import { canReviewListings } from "@/lib/access";
import {
  dismissComplianceTasksForBooking,
  syncComplianceTasksForBooking,
} from "@/lib/compliance";
import {
  buildContractDocumentNumber,
  buildContractHtml,
  buildInvoiceHtml,
  buildInvoiceNumber,
  calculateRefundAmount,
  isContractFullySigned,
  LEGAL_TERMS_VERSION,
  shouldCaptureAuthorizedPayment,
} from "@/lib/commerce";
import { queueNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

async function syncBookingCommerceState(
  tx: PrismaClient | Prisma.TransactionClient,
  bookingId: string,
) {
  const booking = await tx.booking.findUnique({
    where: { id: bookingId },
    include: {
      contract: true,
      payment: true,
      invoice: true,
      hunter: {
        select: {
          id: true,
          email: true,
          pii: {
            select: {
              fullName: true,
            },
          },
        },
      },
      listing: {
        include: {
          property: {
            select: {
              ownerId: true,
              owner: {
                select: {
                  id: true,
                  email: true,
                  pii: {
                    select: {
                      fullName: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!booking) {
    return null;
  }

  const contractSigned =
    booking.contract &&
    isContractFullySigned({
      hunterSignedAt: booking.contract.hunterSignedAt,
      landownerSignedAt: booking.contract.landownerSignedAt,
    });
  const paymentAuthorized =
    booking.payment &&
    new Set<PaymentStatus>([
      PaymentStatus.AUTHORIZED,
      PaymentStatus.CAPTURED,
      PaymentStatus.PARTIALLY_REFUNDED,
      PaymentStatus.REFUNDED,
    ]).has(booking.payment.status);

  if (
    contractSigned &&
    paymentAuthorized &&
    new Set<BookingStatus>([BookingStatus.APPROVED, BookingStatus.CONTRACT_PENDING]).has(
      booking.status,
    )
  ) {
    await tx.booking.update({
      where: { id: booking.id },
      data: {
        status: BookingStatus.CONFIRMED,
        confirmedAt: booking.confirmedAt ?? new Date(),
      },
    });

    await queueNotification(tx, {
      bookingId: booking.id,
      userId: booking.hunter.id,
      template: "booking-confirmed",
      subject: `Booking confirmed for ${booking.listing.title}`,
      body: "The contract and payment are in place. Your booking is now confirmed.",
      markSent: true,
    });
  }

  const freshPayment = await tx.paymentRecord.findUnique({
    where: { bookingId: booking.id },
  });

  if (
    freshPayment?.status === PaymentStatus.AUTHORIZED &&
    shouldCaptureAuthorizedPayment(booking.startDate)
  ) {
    await tx.paymentRecord.update({
      where: { bookingId: booking.id },
      data: {
        status: PaymentStatus.CAPTURED,
        capturedNok: freshPayment.amountNok,
        capturedAt: new Date(),
        payoutAvailableAt: new Date(booking.endDate.getTime() + 1000 * 60 * 60 * 48),
      },
    });

    if (!booking.invoice) {
      const vatNok = Math.round(booking.totalNok * 0.25 * 100) / 100;
      const subtotalNok = Math.round((booking.totalNok - vatNok) * 100) / 100;
      await tx.invoice.create({
        data: {
          bookingId: booking.id,
          invoiceNumber: buildInvoiceNumber(booking.id),
          subtotalNok,
          vatNok,
          totalNok: booking.totalNok,
          contentHtml: buildInvoiceHtml({
            invoiceNumber: buildInvoiceNumber(booking.id),
            listingTitle: booking.listing.title,
            hunterName: booking.hunter.pii?.fullName ?? booking.hunter.email,
            hunterEmail: booking.hunter.email,
            issuedAt: new Date(),
            subtotalNok,
            vatNok,
            totalNok: booking.totalNok,
          }),
        },
      });
    }

    if (
      new Set<BookingStatus>([
        BookingStatus.CONFIRMED,
        BookingStatus.APPROVED,
        BookingStatus.CONTRACT_PENDING,
      ]).has(booking.status)
    ) {
      await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: BookingStatus.ACTIVE,
        },
      });
    }
  }

  const releasedPayment = await tx.paymentRecord.findUnique({
    where: { bookingId: booking.id },
  });

  if (
    releasedPayment?.payoutAvailableAt &&
    !releasedPayment.payoutReleasedAt &&
    releasedPayment.status === PaymentStatus.CAPTURED &&
    releasedPayment.payoutAvailableAt <= new Date()
  ) {
    await tx.paymentRecord.update({
      where: { bookingId: booking.id },
      data: {
        payoutReleasedAt: new Date(),
      },
    });
  }

  await syncComplianceTasksForBooking(tx, bookingId);
}

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
    const parsed = bookingStatusSchema.safeParse(json);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid booking action.";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: {
        id,
      },
      include: {
        contract: true,
        payment: true,
        hunter: {
          select: {
            id: true,
            email: true,
            pii: {
              select: {
                fullName: true,
              },
            },
          },
        },
        listing: {
          include: {
            property: {
              select: {
                cadastralRef: true,
                municipality: true,
                county: true,
                ownerId: true,
                owner: {
                  select: {
                    id: true,
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
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }

    const isOwner = booking.listing.property.ownerId === session.user.id;
    const isHunter = booking.hunterId === session.user.id;
    const isAdmin = canReviewListings(session);
    const action = parsed.data.action;

    if (action === "approve") {
      if (!isOwner && !isAdmin) {
        return NextResponse.json({ error: "Forbidden." }, { status: 403 });
      }

      if (booking.status !== BookingStatus.REQUESTED) {
        return NextResponse.json(
          { error: "Only requested bookings can be approved." },
          { status: 409 },
        );
      }

      const requiresSharedConfirmation =
        booking.listing.coApprovalRequired ||
        booking.listing.governanceModel === ListingGovernanceModel.VALD_MANAGED;

      if (requiresSharedConfirmation && parsed.data.responseMessage.trim().length < 12) {
        return NextResponse.json(
          {
            error:
              "Add a short confirmation note explaining what still needs to be checked before the booking is fully locked in.",
          },
          { status: 400 },
        );
      }

      const updated = await prisma.$transaction(async (tx) => {
        const nextStatus = requiresSharedConfirmation
          ? BookingStatus.SHARED_CONFIRMATION_PENDING
          : BookingStatus.CONTRACT_PENDING;

        const nextBooking = await tx.booking.update({
          where: {
            id,
          },
          data: {
            status: nextStatus,
            landownerResponse: parsed.data.responseMessage || null,
            respondedAt: new Date(),
          },
          select: {
            id: true,
            status: true,
          },
        });

        if (!requiresSharedConfirmation) {
          await tx.contract.upsert({
            where: {
              bookingId: id,
            },
            create: {
              bookingId: id,
              documentNumber: buildContractDocumentNumber(id),
              contentHtml: buildContractHtml({
                documentNumber: buildContractDocumentNumber(id),
                listingTitle: booking.listing.title,
                flowType: booking.flowType,
                hunterName: booking.hunter.pii?.fullName ?? booking.hunter.email,
                hunterEmail: booking.hunter.email,
                landownerName: booking.listing.property.owner.pii?.fullName ?? booking.listing.property.owner.email,
                landownerEmail: booking.listing.property.owner.email,
                cadastralRef: booking.listing.property.cadastralRef,
                municipality: booking.listing.property.municipality,
                county: booking.listing.property.county,
                startDate: booking.startDate,
                endDate: booking.endDate,
                totalNok: booking.totalNok,
                cancellationPolicy: booking.listing.cancellationPolicy,
                requestMessage: booking.requestMessage,
                governanceNotes: booking.listing.governanceNotes,
              }),
              termsVersion: LEGAL_TERMS_VERSION,
              status: ContractStatus.PENDING_SIGNATURE,
              lastSentAt: new Date(),
            },
            update: {
              contentHtml: buildContractHtml({
                documentNumber: buildContractDocumentNumber(id),
                listingTitle: booking.listing.title,
                flowType: booking.flowType,
                hunterName: booking.hunter.pii?.fullName ?? booking.hunter.email,
                hunterEmail: booking.hunter.email,
                landownerName: booking.listing.property.owner.pii?.fullName ?? booking.listing.property.owner.email,
                landownerEmail: booking.listing.property.owner.email,
                cadastralRef: booking.listing.property.cadastralRef,
                municipality: booking.listing.property.municipality,
                county: booking.listing.property.county,
                startDate: booking.startDate,
                endDate: booking.endDate,
                totalNok: booking.totalNok,
                cancellationPolicy: booking.listing.cancellationPolicy,
                requestMessage: booking.requestMessage,
                governanceNotes: booking.listing.governanceNotes,
              }),
              termsVersion: LEGAL_TERMS_VERSION,
              status: ContractStatus.PENDING_SIGNATURE,
              lastSentAt: new Date(),
            },
          });

          await queueNotification(tx, {
            bookingId: id,
            userId: booking.hunterId,
            template: "contract-ready",
            subject: `Contract ready for ${booking.listing.title}`,
            body: "The landowner has moved the booking forward. Sign the contract and authorize payment to confirm the trip.",
            markSent: true,
          });
        }

        return nextBooking;
      });

      return NextResponse.json({
        ok: true,
        booking: updated,
        message: requiresSharedConfirmation
          ? `Booking moved into contract handling pending ${booking.listing.property.vald?.name ?? "shared hunting area"} confirmation.`
          : "Booking approved and moved into contract handling.",
      });
    }

    if (action === "confirm_shared") {
      if (!isOwner && !isAdmin) {
        return NextResponse.json({ error: "Forbidden." }, { status: 403 });
      }

      if (booking.status !== BookingStatus.SHARED_CONFIRMATION_PENDING) {
        return NextResponse.json(
          { error: "Only bookings waiting for shared confirmation can be moved forward here." },
          { status: 409 },
        );
      }

      const updated = await prisma.$transaction(async (tx) => {
        const nextBooking = await tx.booking.update({
          where: { id },
          data: {
            status: BookingStatus.CONTRACT_PENDING,
            landownerResponse: parsed.data.responseMessage || booking.landownerResponse,
            respondedAt: new Date(),
          },
          select: {
            id: true,
            status: true,
          },
        });

        await tx.contract.upsert({
          where: { bookingId: id },
          create: {
            bookingId: id,
            documentNumber: buildContractDocumentNumber(id),
            contentHtml: buildContractHtml({
              documentNumber: buildContractDocumentNumber(id),
              listingTitle: booking.listing.title,
              flowType: booking.flowType,
              hunterName: booking.hunter.pii?.fullName ?? booking.hunter.email,
              hunterEmail: booking.hunter.email,
              landownerName: booking.listing.property.owner.pii?.fullName ?? booking.listing.property.owner.email,
              landownerEmail: booking.listing.property.owner.email,
              cadastralRef: booking.listing.property.cadastralRef,
              municipality: booking.listing.property.municipality,
              county: booking.listing.property.county,
              startDate: booking.startDate,
              endDate: booking.endDate,
              totalNok: booking.totalNok,
              cancellationPolicy: booking.listing.cancellationPolicy,
              requestMessage: booking.requestMessage,
              governanceNotes: booking.listing.governanceNotes,
            }),
            termsVersion: LEGAL_TERMS_VERSION,
            status: ContractStatus.PENDING_SIGNATURE,
            lastSentAt: new Date(),
          },
          update: {
            contentHtml: buildContractHtml({
              documentNumber: buildContractDocumentNumber(id),
              listingTitle: booking.listing.title,
              flowType: booking.flowType,
              hunterName: booking.hunter.pii?.fullName ?? booking.hunter.email,
              hunterEmail: booking.hunter.email,
              landownerName: booking.listing.property.owner.pii?.fullName ?? booking.listing.property.owner.email,
              landownerEmail: booking.listing.property.owner.email,
              cadastralRef: booking.listing.property.cadastralRef,
              municipality: booking.listing.property.municipality,
              county: booking.listing.property.county,
              startDate: booking.startDate,
              endDate: booking.endDate,
              totalNok: booking.totalNok,
              cancellationPolicy: booking.listing.cancellationPolicy,
              requestMessage: booking.requestMessage,
              governanceNotes: booking.listing.governanceNotes,
            }),
            termsVersion: LEGAL_TERMS_VERSION,
            status: ContractStatus.PENDING_SIGNATURE,
            lastSentAt: new Date(),
          },
        });

        await queueNotification(tx, {
          bookingId: id,
          userId: booking.hunterId,
          template: "contract-ready",
          subject: `Contract ready for ${booking.listing.title}`,
          body: "Shared approval is now in place. Sign the contract and authorize payment to confirm the trip.",
          markSent: true,
        });

        return nextBooking;
      });

      return NextResponse.json({
        ok: true,
        booking: updated,
        message: "Shared confirmation recorded. The booking is now in contract handling.",
      });
    }

    if (action === "decline") {
      if (!isOwner && !isAdmin) {
        return NextResponse.json({ error: "Forbidden." }, { status: 403 });
      }

      if (booking.status !== BookingStatus.REQUESTED) {
        return NextResponse.json(
          { error: "Only requested bookings can be declined." },
          { status: 409 },
        );
      }

      const updated = await prisma.$transaction(async (tx) => {
        const nextBooking = await tx.booking.update({
          where: {
            id,
          },
          data: {
            status: BookingStatus.DECLINED,
            landownerResponse: parsed.data.responseMessage || null,
            respondedAt: new Date(),
          },
          select: {
            id: true,
            status: true,
          },
        });

        await tx.contract.updateMany({
          where: { bookingId: id },
          data: { status: ContractStatus.VOID },
        });

        await dismissComplianceTasksForBooking(tx, id);

        return nextBooking;
      });

      return NextResponse.json({ ok: true, booking: updated });
    }

    if (action === "cancel") {
      if (!isHunter && !isOwner && !isAdmin) {
        return NextResponse.json({ error: "Forbidden." }, { status: 403 });
      }

      if (
        booking.status === BookingStatus.CANCELLED ||
        booking.status === BookingStatus.DECLINED ||
        booking.status === BookingStatus.COMPLETED
      ) {
        return NextResponse.json(
          { error: "This booking can no longer be cancelled." },
          { status: 409 },
        );
      }

      const refundNok = calculateRefundAmount(
        booking.listing.cancellationPolicy,
        booking.totalNok,
        booking.startDate,
      );

      const updated = await prisma.$transaction(async (tx) => {
        if (booking.payment) {
          await tx.paymentRecord.update({
            where: { bookingId: id },
            data: {
              refundedNok: refundNok,
              status:
                refundNok >= booking.totalNok
                  ? PaymentStatus.REFUNDED
                  : refundNok > 0
                    ? PaymentStatus.PARTIALLY_REFUNDED
                    : PaymentStatus.CANCELLED,
            },
          });
        }

        await tx.contract.updateMany({
          where: { bookingId: id },
          data: { status: ContractStatus.VOID },
        });

        await dismissComplianceTasksForBooking(tx, id);

        return tx.booking.update({
          where: {
            id,
          },
          data: {
            status: BookingStatus.CANCELLED,
            landownerResponse: parsed.data.responseMessage || booking.landownerResponse,
            respondedAt: new Date(),
            cancelledAt: new Date(),
          },
          select: {
            id: true,
            status: true,
          },
        });
      });

      return NextResponse.json({
        ok: true,
        booking: updated,
        message:
          refundNok > 0
            ? `Booking cancelled. Estimated refund: NOK ${refundNok.toLocaleString("nb-NO")}.`
            : "Booking cancelled. No refund is available under the current cancellation policy.",
      });
    }

    if (action === "sign_hunter" || action === "sign_landowner") {
      const signingAsHunter = action === "sign_hunter";

      if ((signingAsHunter && !isHunter && !isAdmin) || (!signingAsHunter && !isOwner && !isAdmin)) {
        return NextResponse.json({ error: "Forbidden." }, { status: 403 });
      }

      if (!booking.contract) {
        return NextResponse.json({ error: "No contract exists for this booking yet." }, { status: 409 });
      }

      await prisma.$transaction(async (tx) => {
        await tx.contract.update({
          where: { bookingId: id },
          data: {
            hunterSignedAt: signingAsHunter ? booking.contract?.hunterSignedAt ?? new Date() : booking.contract?.hunterSignedAt,
            landownerSignedAt: !signingAsHunter ? booking.contract?.landownerSignedAt ?? new Date() : booking.contract?.landownerSignedAt,
            status:
              signingAsHunter
                ? booking.contract?.landownerSignedAt
                  ? ContractStatus.SIGNED
                  : ContractStatus.PARTIALLY_SIGNED
                : booking.contract?.hunterSignedAt
                  ? ContractStatus.SIGNED
                  : ContractStatus.PARTIALLY_SIGNED,
          },
        });

        await syncBookingCommerceState(tx, id);
      });

      return NextResponse.json({ ok: true, message: "Contract signature recorded." });
    }

    if (action === "confirm") {
      if (!isHunter && !isOwner && !isAdmin) {
        return NextResponse.json({ error: "Forbidden." }, { status: 403 });
      }

      if (!booking.contract || !booking.payment) {
        return NextResponse.json(
          { error: "The contract and payment both need to be in place before confirmation." },
          { status: 409 },
        );
      }

      await prisma.$transaction(async (tx) => {
        await syncBookingCommerceState(tx, id);
      });

      return NextResponse.json({ ok: true, message: "Booking confirmation state refreshed." });
    }

    if (action === "mark_active") {
      if (!isOwner && !isAdmin) {
        return NextResponse.json({ error: "Forbidden." }, { status: 403 });
      }

      await prisma.$transaction(async (tx) => {
        await syncBookingCommerceState(tx, id);
        await tx.booking.update({
          where: { id },
          data: {
            status: BookingStatus.ACTIVE,
          },
        });
      });

      return NextResponse.json({ ok: true, message: "Booking marked as active." });
    }

    if (action === "complete") {
      if (!isHunter && !isOwner && !isAdmin) {
        return NextResponse.json({ error: "Forbidden." }, { status: 403 });
      }

      const completableStatuses: BookingStatus[] = [
        BookingStatus.APPROVED,
        BookingStatus.CONFIRMED,
        BookingStatus.ACTIVE,
      ];

      if (!completableStatuses.includes(booking.status)) {
        return NextResponse.json(
          { error: "Only active or approved trips can be marked as completed." },
          { status: 409 },
        );
      }

      const today = new Date(new Date().toDateString());
      if (booking.endDate > today) {
        return NextResponse.json(
          { error: "A trip can only be completed after its end date has passed." },
          { status: 400 },
        );
      }

      const updated = await prisma.booking.update({
        where: {
          id,
        },
        data: {
          status: BookingStatus.COMPLETED,
          landownerResponse: parsed.data.responseMessage || booking.landownerResponse,
          respondedAt: new Date(),
          completedAt: new Date(),
        },
        select: {
          id: true,
          status: true,
        },
      });

      await prisma.$transaction(async (tx) => {
        await syncComplianceTasksForBooking(tx, id);
      });

      return NextResponse.json({ ok: true, booking: updated, message: "Trip marked as completed." });
    }

    return NextResponse.json({ error: "Unsupported booking action." }, { status: 400 });
  } catch (error) {
    console.error("Booking status update failed", error);
    return NextResponse.json(
      { error: "Something went wrong while changing the booking status." },
      { status: 500 },
    );
  }
}
