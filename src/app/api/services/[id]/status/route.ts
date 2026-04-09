import { NextRequest, NextResponse } from "next/server";
import { ServiceListingStatus } from "@prisma/client";
import { auth } from "@/auth";
import { canManageServices, canReviewListings, getOperationalAccessError, isSignedIn } from "@/lib/access";
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
    issues.push("Leverandørprofilen er ikke komplett.");
  }

  if (service.providerProfile.description.trim().length < 40) {
    issues.push("Leverandørbeskrivelsen trenger mer praktisk innhold.");
  }

  if (service.title.trim().length < 6) {
    issues.push("Tjenestetittelen er for kort.");
  }

  if (service.description.trim().length < 40) {
    issues.push("Tjenestebeskrivelsen trenger mer praktisk innhold.");
  }

  if (!service.municipality.trim() || !service.county.trim()) {
    issues.push("Tjenestestedet er ikke komplett.");
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
    return NextResponse.json(
      { error: getOperationalAccessError(session, "tjeneste") },
      { status: isSignedIn(session) ? 403 : 401 },
    );
  }

  try {
    const json = await request.json();
    const parsed = serviceStatusActionSchema.safeParse(json);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Ugyldig handling for tjenesten.";
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
      return NextResponse.json({ error: "Fant ikke tjenesten." }, { status: 404 });
    }

    const { action, reviewerNotes } = parsed.data;

    if (action === "save_draft" || action === "submit_for_review") {
      if (!canManageServices(session)) {
        return NextResponse.json(
          { error: getOperationalAccessError(session, "tjeneste") },
          { status: isSignedIn(session) ? 403 : 401 },
        );
      }

      if (action === "submit_for_review") {
        const issues = getReadinessIssues(service);

        if (issues.length > 0) {
          return NextResponse.json(
            { error: `Tjenesten er ikke klar for gjennomgang ennå. ${issues[0]}` },
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
      return NextResponse.json(
        { error: getOperationalAccessError(session, "gjennomgang") },
        { status: isSignedIn(session) ? 403 : 401 },
      );
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
    return NextResponse.json({ error: "Kunne ikke oppdatere tjenesten." }, { status: 500 });
  }
}
