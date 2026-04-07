import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { canManageServices } from "@/lib/access";
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

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();

  if (!canManageServices(session)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { id } = await context.params;

  const service = await prisma.serviceListing.findFirst({
    where: {
      id,
      providerProfile: {
        userId: session.user.id,
      },
    },
    include: {
      providerProfile: {
        select: {
          id: true,
          businessName: true,
          municipality: true,
          county: true,
          publicContactName: true,
          phone: true,
          email: true,
          website: true,
        },
      },
    },
  });

  if (!service) {
    return NextResponse.json({ error: "Service not found." }, { status: 404 });
  }

  return NextResponse.json({
    service: {
      ...service,
      qualifications: normalizeQualifications(service.qualifications),
    },
  });
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();

  if (!canManageServices(session)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { id } = await context.params;

  try {
    const json = await request.json();
    const parsed = serviceListingSchema.safeParse(json);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid service payload.";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const existing = await prisma.serviceListing.findFirst({
      where: {
        id,
        providerProfile: {
          userId: session.user.id,
        },
      },
      select: {
        id: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Service not found." }, { status: 404 });
    }

    const data = parsed.data;
    const slug = await buildUniqueServiceSlug(data.title, existing.id);

    const service = await prisma.serviceListing.update({
      where: {
        id: existing.id,
      },
      data: {
        ...data,
        slug,
      },
      include: {
        providerProfile: {
          select: {
            id: true,
            businessName: true,
            municipality: true,
            county: true,
            publicContactName: true,
            phone: true,
            email: true,
            website: true,
          },
        },
      },
    });

    return NextResponse.json({
      ok: true,
      service: {
        ...service,
        qualifications: normalizeQualifications(service.qualifications),
      },
    });
  } catch (error) {
    console.error("Unable to update service", error);
    return NextResponse.json({ error: "Unable to update service." }, { status: 500 });
  }
}
