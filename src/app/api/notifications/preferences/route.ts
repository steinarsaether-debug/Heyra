import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { getDefaultNotificationPreferences } from "@/lib/notification-preferences";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const notificationPreferenceSchema = z.object({
  bookingUpdates: z.boolean(),
  contractUpdates: z.boolean(),
  payoutUpdates: z.boolean(),
  complianceReminders: z.boolean(),
  marketingUpdates: z.boolean(),
  pushEnabled: z.boolean(),
  pushPermission: z.string().max(40).optional(),
  markTested: z.boolean().optional(),
});

export async function GET(_request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const preference = await prisma.notificationPreference.findUnique({
    where: {
      userId: session.user.id,
    },
  });

  return NextResponse.json({
    preference: preference ?? getDefaultNotificationPreferences(),
  });
}

export async function PUT(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const json = await request.json();
    const parsed = notificationPreferenceSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid notification settings." },
        { status: 400 },
      );
    }

    const preference = await prisma.notificationPreference.upsert({
      where: {
        userId: session.user.id,
      },
      create: {
        userId: session.user.id,
        bookingUpdates: parsed.data.bookingUpdates,
        contractUpdates: parsed.data.contractUpdates,
        payoutUpdates: parsed.data.payoutUpdates,
        complianceReminders: parsed.data.complianceReminders,
        marketingUpdates: parsed.data.marketingUpdates,
        pushEnabled: parsed.data.pushEnabled,
        pushPermission: parsed.data.pushPermission ?? null,
        pushTestedAt: parsed.data.markTested ? new Date() : null,
      },
      update: {
        bookingUpdates: parsed.data.bookingUpdates,
        contractUpdates: parsed.data.contractUpdates,
        payoutUpdates: parsed.data.payoutUpdates,
        complianceReminders: parsed.data.complianceReminders,
        marketingUpdates: parsed.data.marketingUpdates,
        pushEnabled: parsed.data.pushEnabled,
        pushPermission: parsed.data.pushPermission ?? null,
        pushTestedAt: parsed.data.markTested ? new Date() : undefined,
      },
    });

    return NextResponse.json({ ok: true, preference });
  } catch (error) {
    console.error("Notification preference update failed", error);
    return NextResponse.json(
      { error: "Something went wrong while saving notification preferences." },
      { status: 500 },
    );
  }
}
