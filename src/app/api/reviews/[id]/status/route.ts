import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { canReviewListings, getOperationalAccessError, isSignedIn } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { reviewModerationSchema } from "@/lib/review-schema";

export const runtime = "nodejs";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();

  if (!canReviewListings(session)) {
    return NextResponse.json(
      { error: getOperationalAccessError(session, "gjennomgang") },
      { status: isSignedIn(session) ? 403 : 401 },
    );
  }

  const { id } = await context.params;

  try {
    const json = await request.json();
    const parsed = reviewModerationSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Ugyldig modereringshandling." },
        { status: 400 },
      );
    }

    const moderationStatus =
      parsed.data.action === "approve"
        ? "APPROVED"
        : parsed.data.action === "flag"
          ? "FLAGGED"
          : "REJECTED";

    const updated = await prisma.review.update({
      where: {
        id,
      },
      data: {
        moderationStatus,
        isFlagged: parsed.data.action === "flag",
        moderatorNotes: parsed.data.moderatorNotes || null,
        publishedAt: parsed.data.action === "approve" ? new Date() : null,
      },
      select: {
        id: true,
        moderationStatus: true,
      },
    });

    return NextResponse.json({ ok: true, review: updated });
  } catch (error) {
    console.error("Review moderation failed", error);
    return NextResponse.json(
      { error: "Noe gikk galt da anmeldelsen skulle modereres." },
      { status: 500 },
    );
  }
}
