import { BookingStatus, UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { reviewSchema } from "@/lib/review-schema";
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

  const review = await prisma.review.findFirst({
    where: {
      bookingId: id,
      reviewerId: session.user.id,
    },
  });

  return NextResponse.json({ review });
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
    const parsed = reviewSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid review payload." },
        { status: 400 },
      );
    }

    const booking = await prisma.booking.findUnique({
      where: {
        id,
      },
      include: {
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

    const isHunterReviewer = booking.hunterId === session.user.id;
    const isLandownerReviewer = booking.listing.property.ownerId === session.user.id;

    if (!isHunterReviewer && !isLandownerReviewer) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    if (booking.status !== BookingStatus.COMPLETED) {
      return NextResponse.json(
        { error: "Reviews are only available after a completed booking." },
        { status: 409 },
      );
    }

    const subjectUserId = isHunterReviewer ? booking.listing.property.ownerId : booking.hunterId;
    const data = parsed.data;

    const review = await prisma.review.upsert({
      where: {
        bookingId_reviewerId: {
          bookingId: booking.id,
          reviewerId: session.user.id,
        },
      },
      update: {
        rating: data.rating,
        title: data.title,
        body: data.body,
        isFlagged: data.flagForReview,
        moderationStatus: data.flagForReview ? "FLAGGED" : "PENDING",
        moderatorNotes: null,
        publishedAt: null,
      },
      create: {
        bookingId: booking.id,
        listingId: booking.listingId,
        reviewerId: session.user.id,
        reviewerRole: isHunterReviewer ? UserRole.HUNTER : UserRole.LANDOWNER,
        subjectUserId,
        rating: data.rating,
        title: data.title,
        body: data.body,
        isFlagged: data.flagForReview,
        moderationStatus: data.flagForReview ? "FLAGGED" : "PENDING",
      },
    });

    return NextResponse.json({ ok: true, review });
  } catch (error) {
    console.error("Review save failed", error);
    return NextResponse.json(
      { error: "Something went wrong while saving the review." },
      { status: 500 },
    );
  }
}
