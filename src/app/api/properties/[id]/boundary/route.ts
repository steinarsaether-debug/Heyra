import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { boundarySchema } from "@/lib/boundary-schema";
import { refreshPropertyCwdStatus } from "@/lib/cwd-zones";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function buildPolygonWkt(points: Array<{ lat: number; lng: number }>) {
  const normalized = [...points];
  const first = normalized[0];
  const last = normalized[normalized.length - 1];

  if (first.lat !== last.lat || first.lng !== last.lng) {
    normalized.push(first);
  }

  return `POLYGON((${normalized.map((point) => `${point.lng} ${point.lat}`).join(", ")}))`;
}

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
    const rows = await prisma.$queryRaw<Array<{ geometry_json: string | null }>>`
      SELECT ST_AsGeoJSON("boundary") AS geometry_json
      FROM "Property"
      WHERE "id" = ${id} AND "ownerId" = ${session.user.id}
      LIMIT 1
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: "Property not found." }, { status: 404 });
    }

    const geometryJson = rows[0]?.geometry_json;

    if (!geometryJson) {
      return NextResponse.json({ points: [] });
    }

    const geometry = JSON.parse(geometryJson) as {
      coordinates?: number[][][];
    };

    const ring = geometry.coordinates?.[0] ?? [];
    const openRing = ring.length > 1 ? ring.slice(0, -1) : ring;
    const points = openRing.map(([lng, lat]) => ({ lat, lng }));

    return NextResponse.json({ points });
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

    const polygonWkt = buildPolygonWkt(parsed.data.points);

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
