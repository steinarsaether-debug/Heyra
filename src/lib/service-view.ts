import {
  Prisma,
  ServiceCategory,
  ServiceListingStatus,
  type PrismaClient,
  type ServiceListing,
  type ServiceProviderProfile,
} from "@prisma/client";

type SearchClient = PrismaClient | Prisma.TransactionClient;

export type ServiceListingEditorRecord = ServiceListing & {
  providerProfile: Pick<
    ServiceProviderProfile,
    "id" | "businessName" | "municipality" | "county" | "publicContactName" | "phone" | "email" | "website"
  >;
};

export type NearbyServiceResult = {
  id: string;
  slug: string;
  category: ServiceCategory;
  title: string;
  municipality: string;
  county: string;
  priceFromNok: number | null;
  businessName: string;
  distanceKm: number | null;
};

export function formatServiceCategory(category: ServiceCategory) {
  return category
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatServiceStatus(status: ServiceListingStatus) {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function buildServiceSlug(title: string, fallbackId?: string) {
  const base = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 70);

  if (base.length > 0) {
    return base;
  }

  return fallbackId ? `service-${fallbackId.toLowerCase()}` : "service";
}

export function getServiceChecklist(
  service: Pick<ServiceListing, "title" | "description" | "municipality" | "county" | "status"> | null,
  provider: Pick<ServiceProviderProfile, "businessName" | "description"> | null,
) {
  const steps = [
    {
      key: "provider",
      label: "Provider profile completed",
      complete: Boolean(provider?.businessName.trim() && provider.description.trim()),
    },
    {
      key: "title",
      label: "Clear service title",
      complete: Boolean(service?.title.trim()),
    },
    {
      key: "description",
      label: "Helpful public description",
      complete: Boolean(service?.description.trim()),
    },
    {
      key: "location",
      label: "Service location set",
      complete: Boolean(service?.municipality.trim() && service?.county.trim()),
    },
  ];

  const completed = steps.filter((step) => step.complete).length;

  return {
    steps,
    completed,
    total: steps.length,
    percent: Math.round((completed / steps.length) * 100),
  };
}

export async function getNearbyServicesForListing(
  prisma: SearchClient,
  listingId: string,
  limit = 4,
) {
  const rows = await prisma.$queryRaw<NearbyServiceResult[]>`
    SELECT
      s."id",
      s."slug",
      s."category",
      s."title",
      s."municipality",
      s."county",
      s."priceFromNok",
      sp."businessName",
      CASE
        WHEN p."centerPoint" IS NOT NULL AND s."latitude" IS NOT NULL AND s."longitude" IS NOT NULL
          THEN ROUND((ST_DistanceSphere(
            p."centerPoint",
            ST_SetSRID(ST_MakePoint(s."longitude", s."latitude"), 4326)
          ) / 1000.0)::numeric, 1)::float8
        ELSE NULL
      END AS "distanceKm"
    FROM "Listing" l
    JOIN "Property" p ON p."id" = l."propertyId"
    JOIN "ServiceListing" s ON s."status" = 'PUBLISHED'
    JOIN "ServiceProviderProfile" sp ON sp."id" = s."providerProfileId"
    WHERE l."id" = ${listingId}
      AND (
        s."municipality" = p."municipality"
        OR s."county" = p."county"
        OR (
          p."centerPoint" IS NOT NULL
          AND s."latitude" IS NOT NULL
          AND s."longitude" IS NOT NULL
          AND ST_DistanceSphere(
            p."centerPoint",
            ST_SetSRID(ST_MakePoint(s."longitude", s."latitude"), 4326)
          ) <= 100000
        )
      )
    ORDER BY
      CASE WHEN s."municipality" = p."municipality" THEN 0 ELSE 1 END,
      CASE WHEN "distanceKm" IS NULL THEN 999999 ELSE "distanceKm" END,
      s."updatedAt" DESC
    LIMIT ${limit}
  `;

  return rows;
}
