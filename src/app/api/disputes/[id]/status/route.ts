import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { canReviewListings } from "@/lib/access";
import { disputeStatusSchema } from "@/lib/dispute-schema";
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
    const parsed = disputeStatusSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid dispute update." },
        { status: 400 },
      );
    }

    const updated = await prisma.disputeTicket.update({
      where: {
        id,
      },
      data: {
        status: parsed.data.status,
        resolutionNotes: parsed.data.resolutionNotes || null,
        assignedAdminId: session?.user?.id,
        resolvedAt: parsed.data.status === "RESOLVED" || parsed.data.status === "CLOSED" ? new Date() : null,
      },
      select: {
        id: true,
        status: true,
      },
    });

    return NextResponse.json({ ok: true, dispute: updated });
  } catch (error) {
    console.error("Dispute update failed", error);
    return NextResponse.json(
      { error: "Something went wrong while updating the dispute." },
      { status: 500 },
    );
  }
}
