import { PropertyStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { canManageProperties, getOperationalAccessError, isSignedIn } from "@/lib/access";
import { propertyDraftSchema } from "@/lib/property-schema";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!canManageProperties(session)) {
    return NextResponse.json(
      { error: getOperationalAccessError(session, "eiendom") },
      { status: isSignedIn(session) ? 403 : 401 },
    );
  }

  try {
    const json = await request.json();
    const parsed = propertyDraftSchema.safeParse(json);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Ugyldig eiendomsdata.";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const data = parsed.data;

    const vald =
      data.valdName.trim().length > 0
        ? await prisma.vald.create({
            data: {
              ownerId: session.user.id,
              name: data.valdName,
              municipality: data.municipality,
              county: data.county,
              representativeName:
                data.valdRepresentativeName.trim() || data.valdName,
              representativePhone: data.valdRepresentativePhone.trim() || null,
              representativeEmail: data.valdRepresentativeEmail.trim() || null,
              localReference: data.valdLocalReference.trim() || null,
              authorityContactName: data.valdAuthorityContactName.trim() || null,
              authorityContactPhone: data.valdAuthorityContactPhone.trim() || null,
              authorityContactEmail: data.valdAuthorityContactEmail.trim() || null,
              bestandsplanName: data.valdBestandsplanName.trim() || null,
              coApprovalRequired: data.valdCoApprovalRequired,
              verificationMethod: data.valdVerificationMethod,
              dataConfidence: data.valdDataConfidence,
              representativeConfirmationStatus: data.representativeConfirmationStatus,
              representativeConfirmedAt:
                data.representativeConfirmationStatus === "CONFIRMED" ? new Date() : null,
              notes: data.valdNotes.trim() || null,
            },
            select: {
              id: true,
            },
          })
        : null;

    const property = await prisma.property.create({
      data: {
        ownerId: session.user.id,
        valdId: vald?.id ?? null,
        cadastralRef: data.cadastralRef,
        municipality: data.municipality,
        county: data.county,
        areaHectares: data.areaHectares,
        geometryConfidence: data.geometryConfidence,
        rightsConfidence: data.rightsConfidence,
        governanceConfidence: data.governanceConfidence,
        boundaryIsApproximate: data.boundaryIsApproximate,
        rightsDifferFromBoundary: data.rightsDifferFromBoundary,
        terrainTypes: data.terrainTypes,
        infrastructure: {
          hasCabins: data.hasCabins,
          hasBoats: data.hasBoats,
          hasHides: data.hasHides,
          hasButcheringFacility: data.hasButcheringFacility,
        },
        status: PropertyStatus.DRAFT,
      },
      select: {
        id: true,
      },
    });

    return NextResponse.json({ ok: true, propertyId: property.id }, { status: 201 });
  } catch (error) {
    console.error("Property draft creation failed", error);
    return NextResponse.json(
      { error: "Noe gikk galt da eiendomsutkastet skulle opprettes." },
      { status: 500 },
    );
  }
}
