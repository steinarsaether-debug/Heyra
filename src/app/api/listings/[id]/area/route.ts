import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  try {
    const rows = await prisma.$queryRaw<Array<{ geometry_json: string | null }>>`
      SELECT ST_AsGeoJSON(p."boundary") AS geometry_json
      FROM "Listing" l
      INNER JOIN "Property" p ON p."id" = l."propertyId"
      WHERE l."id" = ${id} AND l."status" = 'PUBLISHED'
      LIMIT 1
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: "Listing area not found." }, { status: 404 });
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
    console.error("Public listing area load failed", error);
    return NextResponse.json(
      { error: "Something went wrong while loading the public area." },
      { status: 500 },
    );
  }
}
