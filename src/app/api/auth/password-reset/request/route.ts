import { NextRequest, NextResponse } from "next/server";
import { createPasswordResetToken } from "@/lib/password-reset";
import { passwordResetRequestSchema } from "@/lib/password-reset-schema";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const parsed = passwordResetRequestSchema.safeParse(json);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid password reset request.";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: {
        email: parsed.data.email,
      },
    });

    if (!user) {
      return NextResponse.json({ ok: true });
    }

    const reset = await createPasswordResetToken(user.id);

    return NextResponse.json({
      ok: true,
      resetUrl: `/auth/reset-password?token=${reset.plainToken}`,
      expiresAt: reset.expiresAt.toISOString(),
    });
  } catch (error) {
    console.error("Password reset request failed", error);
    return NextResponse.json(
      { error: "Something went wrong while creating the reset request." },
      { status: 500 },
    );
  }
}
