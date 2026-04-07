import { PaymentStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as {
      bookingId?: string;
      event?: "payment_authorized" | "payment_captured" | "payment_failed";
      errorMessage?: string;
    };

    if (!payload.bookingId || !payload.event) {
      return NextResponse.json({ error: "bookingId and event are required." }, { status: 400 });
    }

    const payment = await prisma.paymentRecord.findUnique({
      where: {
        bookingId: payload.bookingId,
      },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment record not found." }, { status: 404 });
    }

    const status =
      payload.event === "payment_authorized"
        ? PaymentStatus.AUTHORIZED
        : payload.event === "payment_captured"
          ? PaymentStatus.CAPTURED
          : PaymentStatus.FAILED;

    const updated = await prisma.paymentRecord.update({
      where: {
        bookingId: payload.bookingId,
      },
      data: {
        status,
        capturedAt: status === PaymentStatus.CAPTURED ? new Date() : payment.capturedAt,
        capturedNok: status === PaymentStatus.CAPTURED ? payment.amountNok : payment.capturedNok,
        lastError: status === PaymentStatus.FAILED ? payload.errorMessage ?? "Simulated payment failure." : null,
      },
      select: {
        id: true,
        status: true,
      },
    });

    return NextResponse.json({ ok: true, payment: updated });
  } catch (error) {
    console.error("Simulated payment webhook failed", error);
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
