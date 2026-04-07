import { NextRequest, NextResponse } from "next/server";
import { consumeEmailVerificationToken } from "@/lib/email-verification";
import { emailVerificationSchema } from "@/lib/email-verification-schema";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const parsed = emailVerificationSchema.safeParse(json);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid verification payload.";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const ok = await consumeEmailVerificationToken(parsed.data.token);

    if (!ok) {
      return NextResponse.json(
        { error: "This verification link is invalid or has expired." },
        { status: 400 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Email verification completion failed", error);
    return NextResponse.json(
      { error: "Something went wrong while verifying the email." },
      { status: 500 },
    );
  }
}
