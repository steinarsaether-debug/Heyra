import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { canReviewListings } from "@/lib/access";
import { writeAdminAuditLog } from "@/lib/admin-audit";
import { prisma } from "@/lib/prisma";
import { getPrimaryUserRole } from "@/lib/user-status";

const grantRoleSchema = z.object({
  email: z.string().trim().email("Skriv inn en gyldig e-postadresse."),
  role: z.nativeEnum(UserRole),
});

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!canReviewListings(session)) {
    return NextResponse.json({ error: "Ikke autorisert." }, { status: 401 });
  }

  try {
    const json = await request.json();
    const parsed = grantRoleSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Ugyldig rolleforespørsel." },
        { status: 400 },
      );
    }

    const normalizedEmail = parsed.data.email.toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        role: true,
        roles: true,
      },
    });

    if (!existingUser) {
      return NextResponse.json(
        {
          error:
            "Fant ingen eksisterende konto med denne e-postadressen. Be brukeren opprette konto først.",
        },
        { status: 404 },
      );
    }

    const currentRoles = existingUser.roles.length > 0
      ? existingUser.roles
      : existingUser.role
        ? [existingUser.role]
        : [];
    const nextRoles = Array.from(new Set([...currentRoles, parsed.data.role]));

    const user = await prisma.user.update({
      where: { id: existingUser.id },
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
      action: "user.role.granted_by_email",
      summary: `La til rolle for ${user.email}.`,
      payload: {
        previousRoles: currentRoles,
        nextRoles,
        email: normalizedEmail,
      },
    });

    return NextResponse.json({ ok: true, user });
  } catch (error) {
    console.error("Admin grant role failed", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Kunne ikke gi rolle til brukeren.",
      },
      { status: 500 },
    );
  }
}
