import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { canReviewListings } from "@/lib/access";
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

  const booking = await prisma.booking.findUnique({
    where: { id },
    select: {
      hunterId: true,
      invoice: true,
      listing: {
        select: {
          property: {
            select: {
              ownerId: true,
            },
          },
        },
      },
    },
  });

  if (!booking?.invoice) {
    return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
  }

  const allowed =
    booking.hunterId === session.user.id ||
    booking.listing.property.ownerId === session.user.id ||
    canReviewListings(session);

  if (!allowed) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  return new NextResponse(booking.invoice.contentHtml, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
