import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { disputeTicketSchema } from "@/lib/dispute-schema";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await context.params;

  const disputes = await prisma.disputeTicket.findMany({
    where: {
      bookingId: id,
      OR: [
        { openedByUserId: session.user.id },
        {
          booking: {
            hunterId: session.user.id,
          },
        },
        {
          booking: {
            listing: {
              property: {
                ownerId: session.user.id,
              },
            },
          },
        },
      ],
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json({ disputes });
}

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
    const parsed = disputeTicketSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid dispute payload." },
        { status: 400 },
      );
    }

    const booking = await prisma.booking.findFirst({
      where: {
        id,
        OR: [
          { hunterId: session.user.id },
          {
            listing: {
              property: {
                ownerId: session.user.id,
              },
            },
          },
        ],
      },
      select: {
        id: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }

    const existingOpenDispute = await prisma.disputeTicket.findFirst({
      where: {
        bookingId: booking.id,
        status: {
          in: ["OPEN", "UNDER_REVIEW"],
        },
      },
      select: {
        id: true,
      },
    });

    if (existingOpenDispute) {
      return NextResponse.json(
        { error: "There is already an active dispute ticket for this booking." },
        { status: 409 },
      );
    }

    const dispute = await prisma.disputeTicket.create({
      data: {
        bookingId: booking.id,
        openedByUserId: session.user.id,
        title: parsed.data.title,
        description: parsed.data.description,
      },
      select: {
        id: true,
        status: true,
      },
    });

    return NextResponse.json({ ok: true, dispute }, { status: 201 });
  } catch (error) {
    console.error("Dispute create failed", error);
    return NextResponse.json(
      { error: "Something went wrong while opening the dispute ticket." },
      { status: 500 },
    );
  }
}
