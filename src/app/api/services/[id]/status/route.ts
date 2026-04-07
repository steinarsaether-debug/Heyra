import { NextRequest, NextResponse } from "next/server";
import { ServiceListingStatus } from "@prisma/client";
import { auth } from "@/auth";
import { canManageServices, canReviewListings } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { serviceStatusActionSchema } from "@/lib/service-schema";

export const runtime = "nodejs";

function getReadinessIssues(service: {
  title: string;
  description: string;
  municipality: string;
  county: string;
  providerProfile: {
    businessName: string;
    description: string;
  };
}) {
  const issues: string[] = [];

  if (service.providerProfile.businessName.trim().length < 3) {
    issues.push("Provider profile is incomplete.");
  }

  if (service.providerProfile.description.trim().length < 40) {
    issues.push("Provider description needs more practical detail.");
  }

  if (service.title.trim().length < 6) {
    issues.push("Service title is too short.");
  }

  if (service.description.trim().length < 40) {
    issues.push("Service description needs more practical detail.");
  }

  if (!service.municipality.trim() || !service.county.trim()) {
    issues.push("Service location is incomplete.");
  }

  return issues;
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  const { id } = await context.params;
  const actorUserId = session?.user?.id ?? null;

  if (!canManageServices(session) && !canReviewListings(session)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  try {
    const json = await request.json();
    const parsed = serviceStatusActionSchema.safeParse(json);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid service action.";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const isAdminReviewer = canReviewListings(session);
    const serviceWhere = isAdminReviewer
      ? { id }
      : {
          id,
          providerProfile: {
            userId: actorUserId ?? "",
          },
        };

    const service = await prisma.serviceListing.findFirst({
      where: serviceWhere,
      include: {
        providerProfile: {
          select: {
            businessName: true,
            description: true,
          },
        },
      },
    });

    if (!service) {
      return NextResponse.json({ error: "Service not found." }, { status: 404 });
    }

    const { action, reviewerNotes } = parsed.data;

    if (action === "save_draft" || action === "submit_for_review") {
      if (!canManageServices(session)) {
        return NextResponse.json({ error: "Forbidden." }, { status: 403 });
      }

      if (action === "submit_for_review") {
        const issues = getReadinessIssues(service);

        if (issues.length > 0) {
          return NextResponse.json(
            { error: `This service is not ready for review yet. ${issues[0]}` },
            { status: 400 },
          );
        }
      }

      const updated = await prisma.serviceListing.update({
        where: { id: service.id },
        data: {
          status:
            action === "save_draft"
              ? ServiceListingStatus.DRAFT
              : ServiceListingStatus.PENDING_REVIEW,
        },
        select: {
          id: true,
          status: true,
        },
      });

      return NextResponse.json({ ok: true, service: updated });
    }

    if (!isAdminReviewer) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const nextStatus =
      action === "publish"
        ? ServiceListingStatus.PUBLISHED
        : action === "revert_to_draft"
          ? ServiceListingStatus.DRAFT
          : ServiceListingStatus.ARCHIVED;

    const updated = await prisma.serviceListing.update({
      where: {
        id: service.id,
      },
      data: {
        status: nextStatus,
        reviewerNotes: reviewerNotes || null,
        reviewedAt: new Date(),
        publishedAt: action === "publish" ? new Date() : action === "archive" ? null : service.publishedAt,
      },
      select: {
        id: true,
        status: true,
      },
    });

    return NextResponse.json({ ok: true, service: updated });
  } catch (error) {
    console.error("Unable to update service status", error);
    return NextResponse.json({ error: "Unable to update the service." }, { status: 500 });
  }
}
