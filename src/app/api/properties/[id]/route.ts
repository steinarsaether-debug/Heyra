import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { canManageProperties, getOperationalAccessError, isSignedIn } from "@/lib/access";
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
    return NextResponse.json(
      { error: getOperationalAccessError(session, "eiendom") },
      { status: isSignedIn(session) ? 403 : 401 },
    );
  }

  const { id } = await context.params;

  try {
    const json = await request.json();
    const parsed = propertyIdentityUpdateSchema.safeParse(json);

    if (!parsed.success) {
      const message =
        parsed.error.issues[0]?.message ?? "Ugyldige opplysninger for eiendommen.";
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
      return NextResponse.json({ error: "Fant ikke eiendommen." }, { status: 404 });
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
      { error: "Noe gikk galt da eiendommen skulle oppdateres." },
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
    return NextResponse.json({ error: "Fant ikke eiendommen." }, { status: 404 });
  }

  const hasListingHistory = property.listings.some(
    (listing) => listing.bookings.length > 0,
  );

  if (hasListingHistory) {
    return NextResponse.json(
      {
        error:
          "Denne eiendommen har bestillingshistorikk. Behold den for historikk og arkiver den tilknyttede annonsen i stedet for å slette eiendommen.",
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
