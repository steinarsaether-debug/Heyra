import bcrypt from "bcryptjs";
import { ConsentType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { createEmailVerificationToken } from "@/lib/email-verification";
import { LEGAL_VERSION } from "@/lib/legal";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/auth-schema";

export const runtime = "nodejs";

function getIpAddress(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "127.0.0.1";
}

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const parsed = registerSchema.safeParse(json);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid registration payload.";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const { fullName, email, password, role, acceptMarketing } = parsed.data;

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with that email already exists." },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const ipAddress = getIpAddress(request);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role,
        roles: [role],
        pii: {
          create: {
            fullName,
          },
        },
        consentRecords: {
          create: [
            {
              type: ConsentType.TERMS_OF_SERVICE,
              version: LEGAL_VERSION,
              ipAddress,
            },
            {
              type: ConsentType.PRIVACY_POLICY,
              version: LEGAL_VERSION,
              ipAddress,
            },
            ...(acceptMarketing
              ? [
                  {
                    type: ConsentType.MARKETING,
                    version: LEGAL_VERSION,
                    ipAddress,
                  },
                ]
              : []),
          ],
        },
      },
    });

    const verification = await createEmailVerificationToken(user.id);

    return NextResponse.json(
      {
        ok: true,
        verifyUrl: `/auth/verify-email?token=${verification.plainToken}`,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Registration failed", error);
    return NextResponse.json(
      { error: "Something went wrong while creating the account." },
      { status: 500 },
    );
  }
}
