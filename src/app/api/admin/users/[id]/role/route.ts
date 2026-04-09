import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { canReviewListings } from "@/lib/access";
import { writeAdminAuditLog } from "@/lib/admin-audit";
import { prisma } from "@/lib/prisma";
import { getPrimaryUserRole } from "@/lib/user-status";

const roleSchema = z.object({
  roles: z.array(z.nativeEnum(UserRole)).min(1, "Velg minst én rolle."),
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
    const parsed = roleSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Ugyldig rolleoppdatering." },
        { status: 400 },
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        roles: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "Fant ikke brukeren." }, { status: 404 });
    }

    const nextRoles = Array.from(new Set(parsed.data.roles));

    if (session.user.id === targetUser.id && !nextRoles.includes(UserRole.ADMIN)) {
      return NextResponse.json(
        { error: "Du kan ikke fjerne din egen administratorrolle her." },
        { status: 400 },
      );
    }

    const currentRoles = targetUser.roles.length > 0 ? targetUser.roles : targetUser.role ? [targetUser.role] : [];

    if (currentRoles.includes(UserRole.ADMIN) && !nextRoles.includes(UserRole.ADMIN)) {
      const adminCount = await prisma.user.count({
        where: {
          roles: {
            has: UserRole.ADMIN,
          },
        },
      });

      if (adminCount <= 1) {
        return NextResponse.json(
          { error: "Heyra må ha minst én administratorbruker." },
          { status: 400 },
        );
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        role: getPrimaryUserRole(nextRoles),
        roles: nextRoles,
      },
      select: {
        id: true,
        email: true,
        role: true,
        roles: true,
      },
    });

    await writeAdminAuditLog(prisma, {
      actorUserId: session.user.id,
      targetUserId: user.id,
      action: "user.role.updated",
      summary: `Oppdaterte brukerroller for ${user.email}.`,
      payload: {
        previousRoles: currentRoles,
        nextRoles,
      },
    });

    return NextResponse.json({ ok: true, user });
  } catch (error) {
    console.error("Admin user role update failed", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Kunne ikke oppdatere brukerrolle.",
      },
      { status: 500 },
    );
  }
}
