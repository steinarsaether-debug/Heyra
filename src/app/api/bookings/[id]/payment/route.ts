import { BookingStatus, PaymentStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { bookingPaymentSchema } from "@/lib/booking-schema";
import { syncComplianceTasksForBooking } from "@/lib/compliance";
import {
  buildInvoiceHtml,
  buildInvoiceNumber,
  isContractFullySigned,
  shouldCaptureAuthorizedPayment,
} from "@/lib/commerce";
import { queueNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(
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
    const parsed = bookingPaymentSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid payment choice." },
        { status: 400 },
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
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
                ownerId: true,
              },
            },
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }

    const isHunter = booking.hunterId === session.user.id;
    const isOwner = booking.listing.property.ownerId === session.user.id;

    if (!isHunter && !isOwner) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    if (!booking.contract) {
      return NextResponse.json({ error: "A contract must exist before payment is authorized." }, { status: 409 });
    }

    if (
      !isContractFullySigned({
        hunterSignedAt: booking.contract.hunterSignedAt,
        landownerSignedAt: booking.contract.landownerSignedAt,
      })
    ) {
      return NextResponse.json(
        { error: "Both sides need to sign the contract before payment can be authorized." },
        { status: 409 },
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.paymentRecord.upsert({
        where: {
          bookingId: id,
        },
        create: {
          bookingId: id,
          provider: parsed.data.provider,
          providerReference: `sim_${Date.now()}`,
          status: shouldCaptureAuthorizedPayment(booking.startDate)
            ? PaymentStatus.CAPTURED
            : PaymentStatus.AUTHORIZED,
          amountNok: booking.totalNok,
          authorizedNok: booking.totalNok,
          capturedNok: shouldCaptureAuthorizedPayment(booking.startDate) ? booking.totalNok : 0,
          platformFeeNok: booking.platformFeeNok,
          payoutNok: booking.payoutNok,
          authorizedAt: new Date(),
          capturedAt: shouldCaptureAuthorizedPayment(booking.startDate) ? new Date() : null,
          payoutAvailableAt: shouldCaptureAuthorizedPayment(booking.startDate)
            ? new Date(booking.endDate.getTime() + 1000 * 60 * 60 * 48)
            : null,
        },
        update: {
          provider: parsed.data.provider,
          providerReference: `sim_${Date.now()}`,
          status: shouldCaptureAuthorizedPayment(booking.startDate)
            ? PaymentStatus.CAPTURED
            : PaymentStatus.AUTHORIZED,
          amountNok: booking.totalNok,
          authorizedNok: booking.totalNok,
          capturedNok: shouldCaptureAuthorizedPayment(booking.startDate) ? booking.totalNok : 0,
          platformFeeNok: booking.platformFeeNok,
          payoutNok: booking.payoutNok,
          authorizedAt: new Date(),
          capturedAt: shouldCaptureAuthorizedPayment(booking.startDate) ? new Date() : null,
          payoutAvailableAt: shouldCaptureAuthorizedPayment(booking.startDate)
            ? new Date(booking.endDate.getTime() + 1000 * 60 * 60 * 48)
            : null,
          lastError: null,
        },
      });

      const bookingStatus = payment.status === PaymentStatus.CAPTURED ? BookingStatus.ACTIVE : BookingStatus.CONFIRMED;

      await tx.booking.update({
        where: { id },
        data: {
          status: bookingStatus,
          confirmedAt: new Date(),
        },
      });

      if (payment.status === PaymentStatus.CAPTURED) {
        const vatNok = Math.round(booking.totalNok * 0.25 * 100) / 100;
        const subtotalNok = Math.round((booking.totalNok - vatNok) * 100) / 100;
        await tx.invoice.upsert({
          where: {
            bookingId: id,
          },
          create: {
            bookingId: id,
            invoiceNumber: buildInvoiceNumber(id),
            subtotalNok,
            vatNok,
            totalNok: booking.totalNok,
            contentHtml: buildInvoiceHtml({
              invoiceNumber: buildInvoiceNumber(id),
              listingTitle: booking.listing.title,
              hunterName: booking.hunter.pii?.fullName ?? booking.hunter.email,
              hunterEmail: booking.hunter.email,
              issuedAt: new Date(),
              subtotalNok,
              vatNok,
              totalNok: booking.totalNok,
            }),
          },
          update: {
            subtotalNok,
            vatNok,
            totalNok: booking.totalNok,
            contentHtml: buildInvoiceHtml({
              invoiceNumber: buildInvoiceNumber(id),
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

      await queueNotification(tx, {
        bookingId: id,
        userId: booking.hunterId,
        template: "payment-authorized",
        subject: `Payment updated for ${booking.listing.title}`,
        body:
          payment.status === PaymentStatus.CAPTURED
            ? "Payment was captured and the booking is now active."
            : "Payment was authorized. The booking is confirmed and will be captured on the start date.",
        markSent: true,
      });

      await syncComplianceTasksForBooking(tx, id);

      return {
        status: payment.status,
        bookingStatus,
      };
    });

    return NextResponse.json({
      ok: true,
      payment: result,
      message:
        result.status === PaymentStatus.CAPTURED
          ? "Payment captured and booking marked active."
          : "Payment authorized and booking confirmed.",
    });
  } catch (error) {
    console.error("Payment authorization failed", error);
    return NextResponse.json(
      { error: "Something went wrong while authorizing the payment." },
      { status: 500 },
    );
  }
}
