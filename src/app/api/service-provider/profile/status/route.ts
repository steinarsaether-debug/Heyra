import { NextRequest, NextResponse } from "next/server";
import { ServiceProviderReviewStatus } from "@prisma/client";
import { auth } from "@/auth";
import { canReviewListings } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { serviceProviderReviewActionSchema } from "@/lib/service-schema";

export const runtime = "nodejs";

export async function PATCH(request: NextRequest) {
  const session = await auth();

  if (!canReviewListings(session)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  try {
    const json = await request.json();
    const parsed = serviceProviderReviewActionSchema.safeParse(json);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid provider review action.";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const profileId = typeof json.profileId === "string" ? json.profileId : "";

    if (!profileId) {
      return NextResponse.json({ error: "Provider profile is required." }, { status: 400 });
    }

    const profile = await prisma.serviceProviderProfile.findUnique({
      where: {
        id: profileId,
      },
      select: {
        id: true,
      },
    });

    if (!profile) {
      return NextResponse.json({ error: "Provider profile not found." }, { status: 404 });
    }

    const { action, moderationNotes } = parsed.data;

    const updated = await prisma.serviceProviderProfile.update({
      where: {
        id: profile.id,
      },
      data: {
        reviewStatus:
          action === "approve"
            ? ServiceProviderReviewStatus.APPROVED
            : ServiceProviderReviewStatus.FLAGGED,
        moderationNotes: moderationNotes || null,
        reviewedAt: new Date(),
        verifiedAt: action === "approve" ? new Date() : null,
      },
      select: {
        id: true,
        reviewStatus: true,
      },
    });

    return NextResponse.json({ ok: true, profile: updated });
  } catch (error) {
    console.error("Unable to review service provider profile", error);
    return NextResponse.json({ error: "Unable to review the provider profile." }, { status: 500 });
  }
}
