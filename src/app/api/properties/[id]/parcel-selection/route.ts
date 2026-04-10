import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { canManageProperties, getOperationalAccessError, isSignedIn } from "@/lib/access";
import { buildMultiPolygonWkt, geometryJsonToPolygons } from "@/lib/geometry";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(
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
    select: { id: true },
  });

  if (!property) {
    return NextResponse.json({ error: "Fant ikke eiendommen." }, { status: 404 });
  }

  const rows = await prisma.$queryRaw<
    Array<{
      id: string;
      source_ref: string;
      title: string;
      municipality_code: string | null;
      municipality_name: string | null;
      gnr: string | null;
      bnr: string | null;
      festenr: string | null;
      snr: string | null;
      group_kind: string;
      is_included: boolean;
      geometry_json: string;
    }>
  >(Prisma.sql`
      SELECT
        "id",
        "sourceRef" AS source_ref,
        "title",
        "municipalityCode" AS municipality_code,
        "municipalityName" AS municipality_name,
        "gnr",
        "bnr",
        "festenr",
        "snr",
        "groupKind"::text AS group_kind,
        "isIncluded" AS is_included,
        ST_AsGeoJSON("geometry") AS geometry_json
      FROM "PropertyParcelSelection"
      WHERE "propertyId" = ${id}
      ORDER BY
        CASE WHEN "isIncluded" THEN 0 ELSE 1 END,
        CASE WHEN "groupKind" = 'SAME_PROPERTY' THEN 0 ELSE 1 END,
        "title" ASC
    `);

  const selections = rows.map((row) => ({
    id: row.id,
    sourceRef: row.source_ref,
    title: row.title,
    municipalityCode: row.municipality_code,
    municipalityName: row.municipality_name,
    gnr: row.gnr,
    bnr: row.bnr,
    festenr: row.festenr,
    snr: row.snr,
    groupKind: row.group_kind as "SAME_PROPERTY" | "NEARBY",
    isIncluded: row.is_included,
    polygons: geometryJsonToPolygons(row.geometry_json),
  }));

  return NextResponse.json({ selections });
}

export async function PUT(
  request: NextRequest,
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
    select: { id: true },
  });

  if (!property) {
    return NextResponse.json({ error: "Fant ikke eiendommen." }, { status: 404 });
  }

  const body = (await request.json()) as {
    selections?: Array<{
      sourceRef: string;
      title: string;
      municipalityCode?: string | null;
      municipalityName?: string | null;
      gnr?: string | null;
      bnr?: string | null;
      festenr?: string | null;
      snr?: string | null;
      groupKind?: "SAME_PROPERTY" | "NEARBY";
      isIncluded?: boolean;
      polygons?: Array<Array<{ lat: number; lng: number }>>;
    }>;
  };

  const selections = Array.isArray(body.selections)
    ? body.selections
        .map((selection) => ({
          ...selection,
          polygons: Array.isArray(selection.polygons)
            ? selection.polygons
                .map((polygon) =>
                  polygon.filter(
                    (point) => Number.isFinite(point.lat) && Number.isFinite(point.lng),
                  ),
                )
                .filter((polygon) => polygon.length >= 3)
            : [],
        }))
        .filter((selection) => selection.sourceRef && selection.title && selection.polygons.length > 0)
    : [];

  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw(
      Prisma.sql`DELETE FROM "PropertyParcelSelection" WHERE "propertyId" = ${id}`,
    );

    for (const selection of selections) {
      await tx.$executeRaw(
        Prisma.sql`
          INSERT INTO "PropertyParcelSelection" (
            "id",
            "propertyId",
            "sourceRef",
            "title",
            "municipalityCode",
            "municipalityName",
            "gnr",
            "bnr",
            "festenr",
            "snr",
            "groupKind",
            "isIncluded",
            "geometry",
            "centerPoint",
            "createdAt",
            "updatedAt"
          )
          VALUES (
            ${crypto.randomUUID()},
            ${id},
            ${selection.sourceRef},
            ${selection.title},
            ${selection.municipalityCode || null},
            ${selection.municipalityName || null},
            ${selection.gnr || null},
            ${selection.bnr || null},
            ${selection.festenr || null},
            ${selection.snr || null},
            ${(selection.groupKind ?? "SAME_PROPERTY")}::"ParcelSelectionGroupKind",
            ${Boolean(selection.isIncluded)},
            ST_SetSRID(ST_GeomFromText(${buildMultiPolygonWkt(selection.polygons)}), 4326),
            ST_Centroid(ST_SetSRID(ST_GeomFromText(${buildMultiPolygonWkt(selection.polygons)}), 4326)),
            NOW(),
            NOW()
          )
        `,
      );
    }
  });

  return NextResponse.json({
    ok: true,
    savedSelectionCount: selections.length,
    includedSelectionCount: selections.filter((selection) => selection.isIncluded).length,
  });
}
