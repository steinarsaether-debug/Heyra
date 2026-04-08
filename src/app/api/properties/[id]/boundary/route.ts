import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { boundarySchema } from "@/lib/boundary-schema";
import { refreshPropertyCwdStatus } from "@/lib/cwd-zones";
import { buildPolygonWkt, geometryJsonToPoints } from "@/lib/geometry";
import { prisma } from "@/lib/prisma";

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
    const rows = await prisma.$queryRaw<
      Array<{
        geometry_json: string | null;
        boundary_source: string | null;
        boundary_imported_at: Date | null;
        boundary_source_ref: string | null;
        boundary_source_label: string | null;
      }>
    >`
      SELECT
        ST_AsGeoJSON("boundary") AS geometry_json,
        "boundarySource"::text AS boundary_source,
        "boundaryImportedAt" AS boundary_imported_at,
        "boundarySourceRef" AS boundary_source_ref,
        "boundarySourceLabel" AS boundary_source_label
      FROM "Property"
      WHERE "id" = ${id} AND "ownerId" = ${session.user.id}
      LIMIT 1
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: "Property not found." }, { status: 404 });
    }

    const geometryJson = rows[0]?.geometry_json;

    if (!geometryJson) {
      return NextResponse.json({
        points: [],
        boundarySource: rows[0]?.boundary_source ?? "MANUAL",
        boundaryImportedAt: rows[0]?.boundary_imported_at?.toISOString() ?? null,
        boundarySourceRef: rows[0]?.boundary_source_ref ?? null,
        boundarySourceLabel: rows[0]?.boundary_source_label ?? null,
      });
    }

    return NextResponse.json({
      points: geometryJsonToPoints(geometryJson),
      boundarySource: rows[0]?.boundary_source ?? "MANUAL",
      boundaryImportedAt: rows[0]?.boundary_imported_at?.toISOString() ?? null,
      boundarySourceRef: rows[0]?.boundary_source_ref ?? null,
      boundarySourceLabel: rows[0]?.boundary_source_label ?? null,
    });
  } catch (error) {
    console.error("Boundary load failed", error);
    return NextResponse.json(
      { error: "Something went wrong while loading the boundary." },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const json = await request.json();
    const parsed = boundarySchema.safeParse({
      points: Array.isArray(json?.points)
        ? json.points.map((point: { lat?: string | number; lng?: string | number }) => ({
            lat: point?.lat,
            lng: point?.lng,
          }))
        : [],
    });

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid boundary payload.";
      return NextResponse.json({ error: message }, { status: 400 });
    }

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

    const normalizedPoints = parsed.data.points.map((point) => ({
      lat: Number(point.lat),
      lng: Number(point.lng),
    }));
    const polygonWkt = buildPolygonWkt(normalizedPoints);

    await prisma.$executeRaw(
      Prisma.sql`
        UPDATE "Property"
        SET
          "boundary" = ST_SetSRID(ST_GeomFromText(${polygonWkt}), 4326),
          "centerPoint" = ST_Centroid(ST_SetSRID(ST_GeomFromText(${polygonWkt}), 4326)),
          "updatedAt" = NOW()
        WHERE "id" = ${id} AND "ownerId" = ${session.user.id}
      `,
    );

    const cwdStatus = await refreshPropertyCwdStatus(id, session.user.id);

    return NextResponse.json({ ok: true, cwdStatus });
  } catch (error) {
    console.error("Boundary update failed", error);
    return NextResponse.json(
      { error: "Something went wrong while saving the boundary." },
      { status: 500 },
    );
  }
}
