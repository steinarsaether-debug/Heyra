import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const review = await prisma.review.update({
      where: {
        id,
      },
      data: {
        isFlagged: true,
        moderationStatus: "FLAGGED",
        moderatorNotes: "Reported by a signed-in user for moderator follow-up.",
        publishedAt: null,
      },
      select: {
        id: true,
      },
    });

    return NextResponse.json({ ok: true, review });
  } catch (error) {
    console.error("Review report failed", error);
    return NextResponse.json(
      { error: "Something went wrong while reporting this review." },
      { status: 500 },
    );
  }
}
