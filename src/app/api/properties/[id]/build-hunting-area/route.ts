import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { canManageProperties, getOperationalAccessError, isSignedIn } from "@/lib/access";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const OVERLAY_SOURCE_REF_PREFIX = "parcel-selection:";

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();

  if (!canManageProperties(session)) {
    return NextResponse.json(
      { error: getOperationalAccessError(session, "eiendom") },
      { status: isSignedIn(session) ? 403 : 401 },
    );
  }

  const { id } = await context.params;

  const property = await prisma.property.findFirst({
    where: {
      id,
      ownerId: session.user.id,
    },
    select: {
      id: true,
      cadastralRef: true,
      parcelSelections: {
        where: { isIncluded: true },
        orderBy: { title: "asc" },
      },
    },
  });

  if (!property) {
    return NextResponse.json({ error: "Fant ikke eiendommen." }, { status: 404 });
  }

  if (property.parcelSelections.length === 0) {
    return NextResponse.json(
      { error: "Marker minst én teig og lagre teigvalget før du bygger jaktterreng." },
      { status: 400 },
    );
  }

  const sourceRef = `${OVERLAY_SOURCE_REF_PREFIX}${id}`;
  const sourceLabel = property.parcelSelections.map((selection) => selection.title).join(" · ");

  const existing = await prisma.rightsOverlay.findFirst({
    where: {
      propertyId: id,
      overlayType: "HUNTING_AREA",
      sourceRef,
    },
    select: { id: true },
  });

  const overlayId = existing?.id ?? crypto.randomUUID();

  await prisma.$executeRaw(
    Prisma.sql`
      WITH selected AS (
        SELECT ST_UnaryUnion(ST_Collect("geometry")) AS geom
        FROM "PropertyParcelSelection"
        WHERE "propertyId" = ${id} AND "isIncluded" = true
      )
      ${existing
        ? Prisma.sql`
            UPDATE "RightsOverlay"
            SET
              "title" = ${`Jaktterreng · ${property.cadastralRef}`},
              "description" = ${"Bygget fra lagrede valgte teiger. Finjuster laget videre hvis jaktretten ikke dekker hele eiendommen."},
              "overlayType" = 'HUNTING_AREA'::"RightsOverlayType",
              "visibility" = 'PRIVATE_DRAFT'::"RightsOverlayVisibility",
              "provenance" = 'KARTVERKET_IMPORT'::"RightsOverlayProvenance",
              "confidence" = 'MEDIUM'::"ConfidenceLevel",
              "sourceRef" = ${sourceRef},
              "sourceLabel" = ${sourceLabel},
              "geometry" = ST_Multi(selected.geom),
              "updatedAt" = NOW()
            FROM selected
            WHERE "id" = ${overlayId}
          `
        : Prisma.sql`
            INSERT INTO "RightsOverlay" (
              "id",
              "propertyId",
              "listingId",
              "title",
              "description",
              "overlayType",
              "visibility",
              "provenance",
              "confidence",
              "sourceRef",
              "sourceLabel",
              "geometry",
              "createdAt",
              "updatedAt"
            )
            SELECT
              ${overlayId},
              ${id},
              NULL,
              ${`Jaktterreng · ${property.cadastralRef}`},
              ${"Bygget fra lagrede valgte teiger. Finjuster laget videre hvis jaktretten ikke dekker hele eiendommen."},
              'HUNTING_AREA'::"RightsOverlayType",
              'PRIVATE_DRAFT'::"RightsOverlayVisibility",
              'KARTVERKET_IMPORT'::"RightsOverlayProvenance",
              'MEDIUM'::"ConfidenceLevel",
              ${sourceRef},
              ${sourceLabel},
              ST_Multi(selected.geom),
              NOW(),
              NOW()
            FROM selected
          `}
    `,
  );

  return NextResponse.json({
    ok: true,
    overlayId,
    includedSelectionCount: property.parcelSelections.length,
  });
}
