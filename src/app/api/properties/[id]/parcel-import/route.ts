import { BoundarySource, Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { buildMultiPolygonWkt } from "@/lib/geometry";
import { importParcelGeometry } from "@/lib/kartverket-parcels";
import { refreshPropertyCwdStatus } from "@/lib/cwd-zones";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

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

    const body = (await request.json()) as {
      sourceRef?: string;
      municipalityCode?: string | null;
      gnr?: string | null;
      bnr?: string | null;
      festenr?: string | null;
      snr?: string | null;
    };

    if (!body.sourceRef && !(body.gnr && body.bnr)) {
      return NextResponse.json(
        { error: "Provide a parcel reference or a matrikkel reference before import." },
        { status: 400 },
      );
    }

    const imported = await importParcelGeometry(body.sourceRef ?? "", {
      municipalityCode: body.municipalityCode,
      gnr: body.gnr,
      bnr: body.bnr,
      festenr: body.festenr,
      snr: body.snr,
    });

    const multipolygonWkt = buildMultiPolygonWkt(imported.polygons);

    await prisma.$executeRaw(
      Prisma.sql`
        UPDATE "Property"
        SET
          "boundary" = ST_CollectionExtract(ST_SetSRID(ST_GeomFromText(${multipolygonWkt}), 4326), 3),
          "centerPoint" = ST_Centroid(ST_SetSRID(ST_GeomFromText(${multipolygonWkt}), 4326)),
          "boundarySource" = ${BoundarySource.KARTVERKET_IMPORT}::"BoundarySource",
          "boundaryImportedAt" = NOW(),
          "boundarySourceRef" = ${imported.parcel.sourceRef},
          "boundarySourceLabel" = ${imported.parcel.title},
          "updatedAt" = NOW()
        WHERE "id" = ${id} AND "ownerId" = ${session.user.id}
      `,
    );

    const cwdStatus = await refreshPropertyCwdStatus(id, session.user.id);

    return NextResponse.json({
      ok: true,
      parcel: imported.parcel,
      points: imported.polygons[0] ?? [],
      cwdStatus,
    });
  } catch (error) {
    console.error("Parcel import failed", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "We could not import the parcel boundary right now.",
      },
      { status: 502 },
    );
  }
}
