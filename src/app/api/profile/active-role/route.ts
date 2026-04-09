import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { activeRoleCookieName } from "@/lib/active-role";
import { getUserRoles } from "@/lib/access";

const activeRoleSchema = z.object({
  role: z.nativeEnum(UserRole),
});

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Du må logge inn." }, { status: 401 });
  }

  try {
    const json = await request.json();
    const parsed = activeRoleSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Ugyldig rollemodus." },
        { status: 400 },
      );
    }

    const userRoles = getUserRoles(session.user);

    if (!userRoles.includes(parsed.data.role)) {
      return NextResponse.json(
        { error: "Denne rollen er ikke tilgjengelig for kontoen." },
        { status: 403 },
      );
    }

    const response = NextResponse.json({ ok: true, role: parsed.data.role });
    response.cookies.set(activeRoleCookieName, parsed.data.role, {
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
    return response;
  } catch (error) {
    console.error("Active role update failed", error);
    return NextResponse.json(
      { error: "Kunne ikke oppdatere aktiv rolle." },
      { status: 500 },
    );
  }
}
