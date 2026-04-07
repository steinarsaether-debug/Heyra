import { ComplianceTaskStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { canReviewListings } from "@/lib/access";
import { complianceTaskActionSchema } from "@/lib/compliance-schema";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function PATCH(
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
    const parsed = complianceTaskActionSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid compliance action." },
        { status: 400 },
      );
    }

    const task = await prisma.complianceTask.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        userId: true,
        status: true,
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Compliance task not found." }, { status: 404 });
    }

    const isAdmin = canReviewListings(session);
    if (task.userId !== session.user.id && !isAdmin) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const nextStatus =
      parsed.data.action === "start"
        ? ComplianceTaskStatus.IN_PROGRESS
        : parsed.data.action === "complete"
          ? ComplianceTaskStatus.COMPLETED
          : parsed.data.action === "dismiss"
            ? ComplianceTaskStatus.DISMISSED
            : ComplianceTaskStatus.OPEN;

    const updated = await prisma.complianceTask.update({
      where: {
        id,
      },
      data: {
        status: nextStatus,
        completedAt:
          nextStatus === ComplianceTaskStatus.COMPLETED ? new Date() : null,
        dismissedAt:
          nextStatus === ComplianceTaskStatus.DISMISSED ? new Date() : null,
      },
      select: {
        id: true,
        status: true,
      },
    });

    return NextResponse.json({ ok: true, task: updated });
  } catch (error) {
    console.error("Compliance task update failed", error);
    return NextResponse.json(
      { error: "Something went wrong while updating the compliance task." },
      { status: 500 },
    );
  }
}
