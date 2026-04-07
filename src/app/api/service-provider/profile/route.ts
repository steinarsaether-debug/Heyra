import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { canManageServices } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import {
  serviceProviderProfileSchema,
  serviceQualificationsSchema,
} from "@/lib/service-schema";

export const runtime = "nodejs";

function normalizeQualifications(value: unknown) {
  return serviceQualificationsSchema.parse(value ?? {});
}

export async function GET() {
  const session = await auth();

  if (!canManageServices(session)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const profile = await prisma.serviceProviderProfile.findUnique({
    where: {
      userId: session.user.id,
    },
  });

  return NextResponse.json({
    profile: profile
      ? {
          ...profile,
          qualifications: normalizeQualifications(profile.qualifications),
        }
      : null,
  });
}

export async function PUT(request: NextRequest) {
  const session = await auth();

  if (!canManageServices(session)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  try {
    const json = await request.json();
    const parsed = serviceProviderProfileSchema.safeParse(json);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid provider payload.";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const data = parsed.data;

    const profile = await prisma.serviceProviderProfile.upsert({
      where: {
        userId: session.user.id,
      },
      create: {
        userId: session.user.id,
        ...data,
      },
      update: {
        ...data,
      },
    });

    return NextResponse.json({
      ok: true,
      profile: {
        ...profile,
        qualifications: normalizeQualifications(profile.qualifications),
      },
    });
  } catch (error) {
    console.error("Unable to save provider profile", error);
    return NextResponse.json({ error: "Unable to save provider profile." }, { status: 500 });
  }
}
