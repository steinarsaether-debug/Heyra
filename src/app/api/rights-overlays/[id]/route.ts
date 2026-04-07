import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { buildMultiPolygonWkt } from "@/lib/geometry";
import { prisma } from "@/lib/prisma";
import { rightsOverlaySchema } from "@/lib/rights-overlay-schema";

export const runtime = "nodejs";

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
    const existing = await prisma.rightsOverlay.findFirst({
      where: {
        id,
        property: {
          ownerId: session.user.id,
        },
      },
      select: {
        id: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Rights overlay not found." }, { status: 404 });
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

    await prisma.$executeRaw(
      Prisma.sql`
        UPDATE "RightsOverlay"
        SET
          "listingId" = ${data.listingId ?? null},
          "title" = ${data.title},
          "description" = ${data.description || null},
          "overlayType" = ${data.overlayType}::"RightsOverlayType",
          "visibility" = ${data.visibility}::"RightsOverlayVisibility",
          "provenance" = ${data.provenance}::"RightsOverlayProvenance",
          "confidence" = ${data.confidence}::"ConfidenceLevel",
          "sourceRef" = ${data.sourceRef || null},
          "sourceLabel" = ${data.sourceLabel || null},
          "geometry" = ST_SetSRID(ST_GeomFromText(${geometryWkt}), 4326),
          "updatedAt" = NOW()
        WHERE "id" = ${id}
      `,
    );

    const overlay = await prisma.rightsOverlay.findUnique({
      where: { id },
    });

    return NextResponse.json({ ok: true, overlay });
  } catch (error) {
    console.error("Rights overlay update failed", error);
    return NextResponse.json(
      { error: "Something went wrong while updating the rights overlay." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const existing = await prisma.rightsOverlay.findFirst({
      where: {
        id,
        property: {
          ownerId: session.user.id,
        },
      },
      select: {
        id: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Rights overlay not found." }, { status: 404 });
    }

    await prisma.rightsOverlay.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Rights overlay delete failed", error);
    return NextResponse.json(
      { error: "Something went wrong while deleting the rights overlay." },
      { status: 500 },
    );
  }
}
