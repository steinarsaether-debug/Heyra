import { prisma } from "@/lib/prisma";

export async function getPropertyBoundaryStatus(propertyId: string, ownerId: string) {
  const rows = await prisma.$queryRaw<Array<{ has_boundary: boolean }>>`
    SELECT ("boundary" IS NOT NULL AND "centerPoint" IS NOT NULL) AS has_boundary
    FROM "Property"
    WHERE "id" = ${propertyId} AND "ownerId" = ${ownerId}
    LIMIT 1
  `;

  return rows[0]?.has_boundary ?? false;
}
