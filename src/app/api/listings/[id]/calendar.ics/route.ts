import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { canReviewListings } from "@/lib/access";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function toIcsDate(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await context.params;

  const listing = await prisma.listing.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      property: {
        select: {
          ownerId: true,
        },
      },
      bookings: {
        where: {
          status: {
            in: ["CONFIRMED", "ACTIVE", "COMPLETED"],
          },
        },
        select: {
          id: true,
          startDate: true,
          endDate: true,
          status: true,
        },
      },
    },
  });

  if (!listing) {
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  }

  if (listing.property.ownerId !== session.user.id && !canReviewListings(session)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const body = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Heyra//Booking Calendar//NB",
    ...listing.bookings.flatMap((booking) => [
      "BEGIN:VEVENT",
      `UID:${booking.id}@heyra.local`,
      `DTSTAMP:${toIcsDate(new Date())}`,
      `DTSTART:${toIcsDate(booking.startDate)}`,
      `DTEND:${toIcsDate(new Date(booking.endDate.getTime() + 1000 * 60 * 60 * 24))}`,
      `SUMMARY:${listing.title}`,
      `DESCRIPTION:Heyra booking status ${booking.status}`,
      "END:VEVENT",
    ]),
    "END:VCALENDAR",
  ].join("\r\n");

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename=\"${listing.id}.ics\"`,
    },
  });
}
