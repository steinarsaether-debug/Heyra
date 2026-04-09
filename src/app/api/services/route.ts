import { NextRequest, NextResponse } from "next/server";
import { ServiceListingStatus } from "@prisma/client";
import { auth } from "@/auth";
import { canManageServices, getOperationalAccessError, isSignedIn } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { serviceListingSchema, serviceQualificationsSchema } from "@/lib/service-schema";
import { buildServiceSlug } from "@/lib/service-view";

export const runtime = "nodejs";

function normalizeQualifications(value: unknown) {
  return serviceQualificationsSchema.parse(value ?? {});
}

async function buildUniqueServiceSlug(title: string, serviceId?: string) {
  const base = buildServiceSlug(title, serviceId);
  let candidate = base;
  let suffix = 2;

  while (true) {
    const existing = await prisma.serviceListing.findFirst({
      where: {
        slug: candidate,
        ...(serviceId
          ? {
              NOT: {
                id: serviceId,
              },
            }
          : {}),
      },
      select: {
        id: true,
      },
    });

    if (!existing) {
      return candidate;
    }

    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!canManageServices(session)) {
    return NextResponse.json(
      { error: getOperationalAccessError(session, "tjeneste") },
      { status: isSignedIn(session) ? 403 : 401 },
    );
  }

  const providerProfile = await prisma.serviceProviderProfile.findUnique({
    where: {
      userId: session.user.id,
    },
    select: {
      id: true,
      municipality: true,
      county: true,
      qualifications: true,
    },
  });

  if (!providerProfile) {
    return NextResponse.json(
      { error: "Lagre leverandørprofilen før du legger til tjenester." },
      { status: 400 },
    );
  }

  try {
    const json = await request.json();
    const parsed = serviceListingSchema.safeParse(json);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Ugyldige opplysninger for tjenesten.";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const data = parsed.data;
    const slug = await buildUniqueServiceSlug(data.title);

    const service = await prisma.serviceListing.create({
      data: {
        providerProfileId: providerProfile.id,
        slug,
        ...data,
        qualifications:
          Object.values(data.qualifications).some(Boolean)
            ? data.qualifications
            : normalizeQualifications(providerProfile.qualifications),
        status: ServiceListingStatus.DRAFT,
      },
      select: {
        id: true,
      },
    });

    return NextResponse.json({ ok: true, serviceId: service.id }, { status: 201 });
  } catch (error) {
    console.error("Unable to create service", error);
    return NextResponse.json({ error: "Kunne ikke opprette tjenesten." }, { status: 500 });
  }
}
