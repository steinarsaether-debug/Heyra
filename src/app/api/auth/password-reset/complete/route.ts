import { NextRequest, NextResponse } from "next/server";
import { consumePasswordResetToken } from "@/lib/password-reset";
import { passwordResetCompleteSchema } from "@/lib/password-reset-schema";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const parsed = passwordResetCompleteSchema.safeParse(json);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid password reset payload.";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const ok = await consumePasswordResetToken(parsed.data.token, parsed.data.password);

    if (!ok) {
      return NextResponse.json(
        { error: "This reset link is invalid or has expired." },
        { status: 400 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Password reset completion failed", error);
    return NextResponse.json(
      { error: "Something went wrong while resetting the password." },
      { status: 500 },
    );
  }
}
