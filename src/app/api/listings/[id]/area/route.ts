import { NextRequest, NextResponse } from "next/server";
import { geometryJsonToPoints } from "@/lib/geometry";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  try {
    const listing = await prisma.listing.findFirst({
      where: {
        id,
        status: "PUBLISHED",
      },
      select: {
        id: true,
        propertyId: true,
        rules: true,
        rightsOverlays: {
          where: {
            visibility: "PUBLIC_SIMPLIFIED",
          },
          orderBy: {
            createdAt: "asc",
          },
          take: 1,
        },
      },
    });

    if (!listing) {
      return NextResponse.json({ error: "Listing area not found." }, { status: 404 });
    }

    const configuredOverlayId =
      (
        listing.rules as {
          publicRightsOverlayId?: string | null;
        } | null
      )?.publicRightsOverlayId ?? null;
    const configuredOverlay = listing.rightsOverlays.find((overlay) => overlay.id === configuredOverlayId);
    const selectedOverlay = configuredOverlay ?? listing.rightsOverlays[0] ?? null;
    const overlayId = selectedOverlay?.id ?? null;

    const parcelRows = await prisma.$queryRaw<Array<{ geometry_json: string | null }>>`
      SELECT ST_AsGeoJSON("boundary") AS geometry_json
      FROM "Property"
      WHERE "id" = ${listing.propertyId}
      LIMIT 1
    `;
    const parcelPoints = geometryJsonToPoints(parcelRows[0]?.geometry_json ?? null);

    if (overlayId) {
      const overlayRows = await prisma.$queryRaw<Array<{ geometry_json: string | null }>>`
        SELECT ST_AsGeoJSON("geometry") AS geometry_json
        FROM "RightsOverlay"
        WHERE "id" = ${overlayId}
        LIMIT 1
      `;
      const geometryJson = overlayRows[0]?.geometry_json;

      return NextResponse.json({
        points: geometryJsonToPoints(geometryJson),
        parcelPoints,
        publicOverlayTitle: selectedOverlay?.title ?? null,
        source: "rights-overlay",
      });
    }

    return NextResponse.json({
      points: parcelPoints,
      parcelPoints,
      publicOverlayTitle: null,
      source: "parcel-boundary",
    });
  } catch (error) {
    console.error("Public listing area load failed", error);
    return NextResponse.json(
      { error: "Something went wrong while loading the public area." },
      { status: 500 },
    );
  }
}
