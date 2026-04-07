import { ExperienceModerationStatus, BookingStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { hunterExperienceSchema } from "@/lib/hunter-experience-schema";
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

  const booking = await prisma.booking.findFirst({
    where: {
      id,
      hunterId: session.user.id,
    },
    include: {
      hunterExperience: true,
      listing: {
        select: {
          title: true,
          slug: true,
        },
      },
    },
  });

  if (!booking) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }

  return NextResponse.json({
    booking: {
      id: booking.id,
      status: booking.status,
      startDate: booking.startDate,
      endDate: booking.endDate,
      listing: booking.listing,
    },
    experience: booking.hunterExperience,
  });
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
    const parsed = hunterExperienceSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid experience payload." },
        { status: 400 },
      );
    }

    const booking = await prisma.booking.findFirst({
      where: {
        id,
        hunterId: session.user.id,
      },
      include: {
        hunterExperience: true,
        listing: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }

    if (booking.status !== BookingStatus.COMPLETED) {
      return NextResponse.json(
        { error: "You can only share experience after a completed trip." },
        { status: 409 },
      );
    }

    const data = parsed.data;
    const experience = booking.hunterExperience
      ? await prisma.hunterExperience.update({
          where: {
            bookingId: booking.id,
          },
          data: {
            ...data,
            moderationStatus: ExperienceModerationStatus.PENDING,
            moderatorNotes: null,
            publishedAt: null,
          },
        })
      : await prisma.hunterExperience.create({
          data: {
            bookingId: booking.id,
            listingId: booking.listing.id,
            hunterId: session.user.id,
            ...data,
          },
        });

    return NextResponse.json({ ok: true, experience }, { status: 200 });
  } catch (error) {
    console.error("Hunter experience save failed", error);
    return NextResponse.json(
      { error: "Something went wrong while saving the hunter experience." },
      { status: 500 },
    );
  }
}
