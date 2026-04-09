import { UserStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { canReviewListings } from "@/lib/access";
import { writeAdminAuditLog } from "@/lib/admin-audit";
import { prisma } from "@/lib/prisma";

const statusSchema = z.object({
  status: z.nativeEnum(UserStatus),
  reason: z.string().trim().max(1000).optional().default(""),
});

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();

  if (!canReviewListings(session)) {
    return NextResponse.json({ error: "Ikke autorisert." }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const json = await request.json();
    const parsed = statusSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Ugyldig statusoppdatering." },
        { status: 400 },
      );
    }

    const suspendedAt = parsed.data.status === UserStatus.SUSPENDED ? new Date() : null;
    const deactivatedAt = parsed.data.status === UserStatus.DEACTIVATED ? new Date() : null;

    const user = await prisma.user.update({
      where: { id },
      data: {
        status: parsed.data.status,
        statusReason: parsed.data.reason || null,
        suspendedAt,
        deactivatedAt,
      },
      select: {
        id: true,
        email: true,
        status: true,
      },
    });

    await writeAdminAuditLog(prisma, {
      actorUserId: session.user.id,
      targetUserId: user.id,
      action: "user.status.updated",
      summary: `Oppdaterte brukerstatus til ${user.status.toLowerCase()} for ${user.email}.`,
      payload: {
        status: parsed.data.status,
        reason: parsed.data.reason || null,
      },
    });

    return NextResponse.json({ ok: true, user });
  } catch (error) {
    console.error("Admin user status update failed", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Kunne ikke oppdatere brukerstatus.",
      },
      { status: 500 },
    );
  }
}
