import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createEmailVerificationToken } from "@/lib/email-verification";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      emailVerified: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  if (user.emailVerified) {
    return NextResponse.json({ ok: true, alreadyVerified: true });
  }

  const verification = await createEmailVerificationToken(session.user.id);

  return NextResponse.json({
    ok: true,
    verifyUrl: `/auth/verify-email?token=${verification.plainToken}`,
    expiresAt: verification.expiresAt.toISOString(),
  });
}
