import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { canManageProperties } from "@/lib/access";
import { propertyDraftSchema } from "@/lib/property-schema";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const propertyIdentityUpdateSchema = propertyDraftSchema.pick({
  cadastralRef: true,
  municipality: true,
  county: true,
  areaHectares: true,
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();

  if (!canManageProperties(session)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { id } = await context.params;

  try {
    const json = await request.json();
    const parsed = propertyIdentityUpdateSchema.safeParse(json);

    if (!parsed.success) {
      const message =
        parsed.error.issues[0]?.message ?? "Invalid property update payload.";
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

    const updated = await prisma.property.update({
      where: {
        id: property.id,
      },
      data: {
        cadastralRef: parsed.data.cadastralRef,
        municipality: parsed.data.municipality,
        county: parsed.data.county,
        areaHectares: parsed.data.areaHectares,
      },
      select: {
        id: true,
        cadastralRef: true,
        municipality: true,
        county: true,
        areaHectares: true,
      },
    });

    return NextResponse.json({ ok: true, property: updated });
  } catch (error) {
    console.error("Property update failed", error);
    return NextResponse.json(
      { error: "Something went wrong while updating the property." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();

  if (!canManageProperties(session)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { id } = await context.params;

  const property = await prisma.property.findFirst({
    where: {
      id,
      ownerId: session.user.id,
    },
    include: {
      listings: {
        select: {
          id: true,
          bookings: {
            select: {
              id: true,
            },
            take: 1,
          },
        },
      },
    },
  });

  if (!property) {
    return NextResponse.json({ error: "Property not found." }, { status: 404 });
  }

  const hasListingHistory = property.listings.some(
    (listing) => listing.bookings.length > 0,
  );

  if (hasListingHistory) {
    return NextResponse.json(
      {
        error:
          "This property has booking history. Keep it for records and archive the related listing instead of deleting the property.",
      },
      { status: 400 },
    );
  }

  await prisma.property.delete({
    where: {
      id: property.id,
    },
  });

  return NextResponse.json({ ok: true });
}
