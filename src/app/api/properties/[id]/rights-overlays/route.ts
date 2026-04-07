import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { buildMultiPolygonWkt, geometryJsonToPolygons } from "@/lib/geometry";
import { prisma } from "@/lib/prisma";
import { rightsOverlaySchema } from "@/lib/rights-overlay-schema";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const property = await prisma.property.findFirst({
      where: {
        id,
        ownerId: session.user.id,
      },
      select: {
        id: true,
        rightsOverlays: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!property) {
      return NextResponse.json({ error: "Property not found." }, { status: 404 });
    }

    const rows = await prisma.$queryRaw<
      Array<{
        id: string;
        geometry_json: string;
      }>
    >`
      SELECT "id", ST_AsGeoJSON("geometry") AS geometry_json
      FROM "RightsOverlay"
      WHERE "propertyId" = ${id}
    `;

    const geometries = new Map(rows.map((row) => [row.id, row.geometry_json]));

    return NextResponse.json({
      overlays: property.rightsOverlays.map((overlay) => ({
        ...overlay,
        polygons: geometryJsonToPolygons(geometries.get(overlay.id) ?? null),
      })),
    });
  } catch (error) {
    console.error("Rights overlay load failed", error);
    return NextResponse.json(
      { error: "Something went wrong while loading rights overlays." },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const property = await prisma.property.findFirst({
      where: {
        id,
        ownerId: session.user.id,
      },
      select: {
        id: true,
      },
    });

    if (!property) {
      return NextResponse.json({ error: "Property not found." }, { status: 404 });
    }

    const parsed = rightsOverlaySchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid overlay payload." },
        { status: 400 },
      );
    }

    const data = parsed.data;
    const geometryWkt = buildMultiPolygonWkt(data.polygons);
    const createdId = crypto.randomUUID();

    await prisma.$executeRaw(
      Prisma.sql`
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
        VALUES (
          ${createdId},
          ${id},
          ${data.listingId ?? null},
          ${data.title},
          ${data.description || null},
          ${data.overlayType}::"RightsOverlayType",
          ${data.visibility}::"RightsOverlayVisibility",
          ${data.provenance}::"RightsOverlayProvenance",
          ${data.confidence}::"ConfidenceLevel",
          ${data.sourceRef || null},
          ${data.sourceLabel || null},
          ST_SetSRID(ST_GeomFromText(${geometryWkt}), 4326),
          NOW(),
          NOW()
        )
      `,
    );

    const overlay = await prisma.rightsOverlay.findUnique({
      where: { id: createdId },
    });

    return NextResponse.json({ ok: true, overlay });
  } catch (error) {
    console.error("Rights overlay create failed", error);
    return NextResponse.json(
      { error: "Something went wrong while creating the rights overlay." },
      { status: 500 },
    );
  }
}
