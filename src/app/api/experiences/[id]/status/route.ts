import { ExperienceModerationStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { canReviewListings } from "@/lib/access";
import { hunterExperienceModerationSchema } from "@/lib/hunter-experience-schema";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();

  if (!canReviewListings(session)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { id } = await context.params;

  try {
    const json = await request.json();
    const parsed = hunterExperienceModerationSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid moderation action." },
        { status: 400 },
      );
    }

    const updated = await prisma.hunterExperience.update({
      where: {
        id,
      },
      data: {
        moderationStatus:
          parsed.data.action === "approve"
            ? ExperienceModerationStatus.APPROVED
            : parsed.data.action === "flag"
              ? ExperienceModerationStatus.FLAGGED
              : ExperienceModerationStatus.REJECTED,
        moderatorNotes: parsed.data.moderatorNotes || null,
        publishedAt: parsed.data.action === "approve" ? new Date() : null,
      },
      select: {
        id: true,
        moderationStatus: true,
      },
    });

    return NextResponse.json({ ok: true, experience: updated });
  } catch (error) {
    console.error("Hunter experience moderation failed", error);
    return NextResponse.json(
      { error: "Something went wrong while moderating the experience." },
      { status: 500 },
    );
  }
}
