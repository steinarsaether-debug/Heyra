import { BoundarySource, Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { buildPolygonWkt, simplifyPointsForEditor, type MapPoint } from "@/lib/geometry";
import { importParcelGeometry } from "@/lib/kartverket-parcels";
import { refreshPropertyCwdStatus } from "@/lib/cwd-zones";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function estimatePolygonArea(points: MapPoint[]) {
  if (points.length < 3) {
    return 0;
  }

  let area = 0;

  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];

    area += current.lng * next.lat - next.lng * current.lat;
  }

  return Math.abs(area / 2);
}

function selectPrimaryPolygon(polygons: MapPoint[][]) {
  return [...polygons]
    .filter((polygon) => polygon.length >= 3)
    .sort((left, right) => estimatePolygonArea(right) - estimatePolygonArea(left))[0];
}

function calculateAreaDifferencePercent(statedAreaHectares: number, importedAreaHectares: number) {
  if (statedAreaHectares <= 0 || importedAreaHectares <= 0) {
    return null;
  }

  return Math.round((Math.abs(importedAreaHectares - statedAreaHectares) / statedAreaHectares) * 100);
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
        areaHectares: true,
      },
    });

    if (!property) {
      return NextResponse.json({ error: "Property not found." }, { status: 404 });
    }

    const body = (await request.json()) as {
      sourceRef?: string;
      title?: string;
      municipalityCode?: string | null;
      gnr?: string | null;
      bnr?: string | null;
      festenr?: string | null;
      snr?: string | null;
      polygons?: Array<Array<{ lat: number; lng: number }>>;
    };

    if (!body.sourceRef && !(body.gnr && body.bnr)) {
      return NextResponse.json(
        { error: "Provide a parcel reference or a matrikkel reference before import." },
        { status: 400 },
      );
    }

    const providedPolygons =
      Array.isArray(body.polygons) &&
      body.polygons.some((polygon) => Array.isArray(polygon) && polygon.length >= 3)
        ? body.polygons
            .map((polygon) =>
              polygon.filter(
                (point) => Number.isFinite(point.lat) && Number.isFinite(point.lng),
              ),
            )
            .filter((polygon) => polygon.length >= 3)
        : [];

    const imported =
      providedPolygons.length > 0
        ? {
            parcel: {
              sourceRef:
                body.sourceRef ??
                [body.municipalityCode, body.gnr, body.bnr, body.festenr, body.snr]
                  .filter(Boolean)
                  .join("-"),
              title:
                body.title ??
                [body.gnr, body.bnr, body.festenr, body.snr].filter(Boolean).join("/") ??
                "Kartverket-teig",
            },
            polygons: providedPolygons,
          }
        : await importParcelGeometry(body.sourceRef ?? "", {
            municipalityCode: body.municipalityCode,
            gnr: body.gnr,
            bnr: body.bnr,
            festenr: body.festenr,
            snr: body.snr,
          });

    const primaryPolygon = selectPrimaryPolygon(imported.polygons);

    if (!primaryPolygon) {
      return NextResponse.json(
        { error: "Vi fant ingen brukbar teigflate i Kartverket-dataene." },
        { status: 502 },
      );
    }

    const simplifiedPrimaryPolygon = simplifyPointsForEditor(primaryPolygon);
    const polygonWkt = buildPolygonWkt(simplifiedPrimaryPolygon);
    const fullResolutionPolygonWkt = buildPolygonWkt(primaryPolygon);

    const rows = await prisma.$queryRaw<Array<{ kartverket_area_hectares: number | null }>>(
      Prisma.sql`
        WITH imported_shape AS (
          SELECT ST_SetSRID(ST_GeomFromText(${fullResolutionPolygonWkt}), 4326) AS geom
        ),
        editable_shape AS (
          SELECT ST_SetSRID(ST_GeomFromText(${polygonWkt}), 4326) AS geom
        )
        UPDATE "Property"
        SET
          "boundary" = editable_shape.geom,
          "centerPoint" = ST_Centroid(editable_shape.geom),
          "kartverketAreaHectares" = ST_Area(ST_Transform(imported_shape.geom, 25833)) / 10000.0,
          "boundarySource" = ${BoundarySource.KARTVERKET_IMPORT}::"BoundarySource",
          "boundaryImportedAt" = NOW(),
          "boundarySourceRef" = ${imported.parcel.sourceRef},
          "boundarySourceLabel" = ${imported.parcel.title},
          "updatedAt" = NOW()
        FROM imported_shape, editable_shape
        WHERE "id" = ${id} AND "ownerId" = ${session.user.id}
        RETURNING "kartverketAreaHectares" AS kartverket_area_hectares
      `,
    );

    const importedAreaHectares = rows[0]?.kartverket_area_hectares ?? null;
    const areaDifferencePercent =
      importedAreaHectares === null
        ? null
        : calculateAreaDifferencePercent(property.areaHectares, importedAreaHectares);

    const cwdStatus = await refreshPropertyCwdStatus(id, session.user.id);

    return NextResponse.json({
      ok: true,
      parcel: imported.parcel,
      points: simplifiedPrimaryPolygon,
      importedPointCount: primaryPolygon.length,
      simplifiedPointCount: simplifiedPrimaryPolygon.length,
      importedPolygonCount: imported.polygons.length,
      importedAreaHectares,
      areaDifferencePercent,
      cwdStatus,
    });
  } catch (error) {
    console.error("Parcel import failed", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Vi klarte ikke å importere teigen akkurat nå.",
      },
      { status: 502 },
    );
  }
}
