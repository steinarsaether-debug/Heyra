import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type PropertyCwdSummary = {
  isInCwdZone: boolean;
  cwdZoneId: string | null;
  cwdZoneName: string | null;
};

export async function refreshPropertyCwdStatus(propertyId: string, ownerId?: string) {
  const rows = await prisma.$queryRaw<
    Array<{ zone_id: string; zone_name: string }>
  >(Prisma.sql`
    SELECT z."id" AS zone_id, z."name" AS zone_name
    FROM "Property" p
    JOIN "CwdZone" z ON ST_Intersects(p."boundary", z."geometry")
    WHERE p."id" = ${propertyId}
    ${ownerId ? Prisma.sql`AND p."ownerId" = ${ownerId}` : Prisma.empty}
    ORDER BY ST_Area(ST_Intersection(p."boundary", z."geometry")) DESC
    LIMIT 1
  `);

  const match = rows[0] ?? null;

  await prisma.property.update({
    where: {
      id: propertyId,
    },
    data: {
      isInCwdZone: Boolean(match),
      cwdZoneId: match?.zone_id ?? null,
    },
  });

  return {
    isInCwdZone: Boolean(match),
    cwdZoneId: match?.zone_id ?? null,
    cwdZoneName: match?.zone_name ?? null,
  };
}

export async function getPropertyCwdSummary(propertyId: string) {
  const property = await prisma.property.findUnique({
    where: {
      id: propertyId,
    },
    select: {
      isInCwdZone: true,
      cwdZoneId: true,
      cwdZone: {
        select: {
          name: true,
        },
      },
    },
  });

  return {
    isInCwdZone: property?.isInCwdZone ?? false,
    cwdZoneId: property?.cwdZoneId ?? null,
    cwdZoneName: property?.cwdZone?.name ?? null,
  } satisfies PropertyCwdSummary;
}
