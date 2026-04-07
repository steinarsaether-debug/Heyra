import { ConsentType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { cookieConsentSchema } from "@/lib/consent-schema";
import { LEGAL_VERSION } from "@/lib/legal";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function getIpAddress(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "127.0.0.1";
}

export async function PUT(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ ok: true });
  }

  try {
    const json = await request.json();
    const parsed = cookieConsentSchema.safeParse(json);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid consent payload.";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const ipAddress = getIpAddress(request);
    const marketingConsent = parsed.data.marketing;
    const existing = await prisma.consentRecord.findFirst({
      where: {
        userId: session.user.id,
        type: ConsentType.MARKETING,
        revokedAt: null,
      },
      orderBy: {
        grantedAt: "desc",
      },
    });

    if (marketingConsent && !existing) {
      await prisma.consentRecord.create({
        data: {
          userId: session.user.id,
          type: ConsentType.MARKETING,
          version: LEGAL_VERSION,
          ipAddress,
        },
      });
    }

    if (!marketingConsent && existing) {
      await prisma.consentRecord.update({
        where: {
          id: existing.id,
        },
        data: {
          revokedAt: new Date(),
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Consent update failed", error);
    return NextResponse.json(
      { error: "Something went wrong while updating consent preferences." },
      { status: 500 },
    );
  }
}
