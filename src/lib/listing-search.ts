import { ListingType, Prisma, PrismaClient, PricingModel, Species } from "@prisma/client";
import { normalizeListingAvailability } from "./listing-availability";
import { getAverageRating } from "./review-view";
import { getHostQualityBadge, getTrustSummary } from "./trust-summary";
import { haversineDistanceKm } from "./fishing-nearby";

type SearchClient = PrismaClient | Prisma.TransactionClient;

export type ListingSearchParams = {
  q: string;
  type: ListingType | null;
  species: Species | null;
  municipality: string;
  minPrice: number | null;
  maxPrice: number | null;
  availability: "all" | "open_now";
  nearLat: number | null;
  nearLng: number | null;
  radiusKm: number;
  north: number | null;
  south: number | null;
  east: number | null;
  west: number | null;
  view: "list" | "map";
};

export type ListingSearchResult = {
  id: string;
  slug: string;
  title: string;
  description: string;
  type: ListingType;
  species: Species[];
  pricingModel: PricingModel;
  priceNok: number;
  instantBookEnabled: boolean;
  municipality: string;
  county: string;
  latitude: number | null;
  longitude: number | null;
  leadPhoto: string | null;
  trustLabel: string;
  trustDetail: string;
  hostBadgeLabel: string | null;
  hostBadgeTone: "forest" | "amber" | null;
  averageRating: number | null;
  reviewCount: number;
  availabilityLabel: string;
  availabilityOpen: boolean;
  distanceKm: number | null;
};

type SearchBaseRow = {
  id: string;
  slug: string;
  title: string;
  description: string;
  type: ListingType;
  species: Species[];
  pricingModel: PricingModel;
  priceNok: number;
  instantBookEnabled: boolean;
  availabilityCalendar: Prisma.JsonValue | null;
  photos: string[];
  municipality: string;
  county: string;
  ownerId: string;
  latitude: number | null;
  longitude: number | null;
  updatedAt: Date;
};

function parseEnumValue<T extends string>(value: string | undefined, allowed: readonly T[]) {
  return allowed.includes(value as T) ? (value as T) : null;
}

function parseNumber(value: string | undefined) {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseListingSearchParams(
  input: URLSearchParams | Record<string, string | string[] | undefined>,
): ListingSearchParams {
  const getValue = (key: string) => {
    if (input instanceof URLSearchParams) {
      return input.get(key) ?? undefined;
    }

    const value = input[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const minPrice = parseNumber(getValue("minPrice"));
  const maxPrice = parseNumber(getValue("maxPrice"));
  const radiusKm = parseNumber(getValue("radiusKm")) ?? 75;
  const north = parseNumber(getValue("north"));
  const south = parseNumber(getValue("south"));
  const east = parseNumber(getValue("east"));
  const west = parseNumber(getValue("west"));
  const availability =
    getValue("availability") === "open_now" ? "open_now" : "all";
  const view = getValue("view") === "map" ? "map" : "list";

  return {
    q: getValue("q")?.trim() ?? "",
    type: parseEnumValue(getValue("type"), Object.values(ListingType)),
    species: parseEnumValue(getValue("species"), Object.values(Species)),
    municipality: getValue("municipality")?.trim() ?? "",
    minPrice,
    maxPrice,
    availability,
    nearLat: parseNumber(getValue("nearLat")),
    nearLng: parseNumber(getValue("nearLng")),
    radiusKm: Math.max(1, Math.min(250, radiusKm)),
    north,
    south,
    east,
    west,
    view,
  };
}

export function buildListingSearchQueryString(params: Partial<ListingSearchParams>) {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (
      value === null ||
      value === undefined ||
      value === "" ||
      value === "all" ||
      (key === "view" && value === "list")
    ) {
      continue;
    }

    search.set(key, String(value));
  }

  return search.toString();
}

export function isListingOpenNow(
  availabilityCalendar: Prisma.JsonValue | null,
  now = new Date(),
) {
  const availability = normalizeListingAvailability(availabilityCalendar);
  return !availability.blockedRanges.some((range) => {
    const blockedStart = new Date(range.startDate);
    const blockedEnd = new Date(range.endDate);

    if (Number.isNaN(blockedStart.getTime()) || Number.isNaN(blockedEnd.getTime())) {
      return false;
    }

    return blockedStart <= now && blockedEnd >= now;
  });
}

export function getAvailabilityLabel(input: {
  instantBookEnabled: boolean;
  availabilityCalendar: Prisma.JsonValue | null;
  now?: Date;
}) {
  const isOpen = isListingOpenNow(input.availabilityCalendar, input.now);

  if (!isOpen) {
    return "Temporarily blocked";
  }

  return input.instantBookEnabled ? "Open now with instant checkout" : "Open for request";
}

function matchesBbox(
  row: SearchBaseRow,
  params: ListingSearchParams,
) {
  if (
    params.north === null ||
    params.south === null ||
    params.east === null ||
    params.west === null
  ) {
    return true;
  }

  if (row.latitude === null || row.longitude === null) {
    return false;
  }

  return (
    row.latitude <= params.north &&
    row.latitude >= params.south &&
    row.longitude <= params.east &&
    row.longitude >= params.west
  );
}

function matchesNearby(row: SearchBaseRow, params: ListingSearchParams) {
  if (params.nearLat === null || params.nearLng === null) {
    return true;
  }

  if (row.latitude === null || row.longitude === null) {
    return false;
  }

  return (
    haversineDistanceKm(
      { latitude: params.nearLat, longitude: params.nearLng },
      { latitude: row.latitude, longitude: row.longitude },
    ) <= params.radiusKm
  );
}

function buildNearbyDistance(row: SearchBaseRow, params: ListingSearchParams) {
  if (
    params.nearLat === null ||
    params.nearLng === null ||
    row.latitude === null ||
    row.longitude === null
  ) {
    return null;
  }

  return haversineDistanceKm(
    { latitude: params.nearLat, longitude: params.nearLng },
    { latitude: row.latitude, longitude: row.longitude },
  );
}

export function rankSearchRows(left: ListingSearchResult, right: ListingSearchResult, params: ListingSearchParams) {
  if (params.nearLat !== null && params.nearLng !== null) {
    if (left.distanceKm !== null && right.distanceKm !== null && left.distanceKm !== right.distanceKm) {
      return left.distanceKm - right.distanceKm;
    }
    if (left.instantBookEnabled !== right.instantBookEnabled) {
      return left.instantBookEnabled ? -1 : 1;
    }
  }

  if (left.availabilityOpen !== right.availabilityOpen) {
    return left.availabilityOpen ? -1 : 1;
  }

  if (left.averageRating !== right.averageRating) {
    return (right.averageRating ?? -1) - (left.averageRating ?? -1);
  }

  return left.priceNok - right.priceNok;
}

async function loadSearchBaseRows(prisma: SearchClient) {
  return prisma.$queryRaw<SearchBaseRow[]>`
    SELECT
      l."id",
      l."slug",
      l."title",
      l."description",
      l."type",
      l."species",
      l."pricingModel",
      l."priceNok",
      l."instantBookEnabled",
      l."availabilityCalendar",
      l."photos",
      p."municipality",
      p."county",
      p."ownerId",
      CASE WHEN p."centerPoint" IS NOT NULL THEN ST_Y(p."centerPoint")::float8 ELSE NULL END AS "latitude",
      CASE WHEN p."centerPoint" IS NOT NULL THEN ST_X(p."centerPoint")::float8 ELSE NULL END AS "longitude",
      l."updatedAt"
    FROM "Listing" l
    INNER JOIN "Property" p ON p."id" = l."propertyId"
    WHERE l."status" = 'PUBLISHED'
  `;
}

export async function searchPublishedListings(
  prisma: SearchClient,
  params: ListingSearchParams,
) {
  const baseRows = await loadSearchBaseRows(prisma);

  const filteredRows = baseRows.filter((row) => {
    if (params.type && row.type !== params.type) {
      return false;
    }

    if (params.species && !row.species.includes(params.species)) {
      return false;
    }

    if (
      params.municipality &&
      !row.municipality.toLowerCase().includes(params.municipality.toLowerCase())
    ) {
      return false;
    }

    if (params.minPrice !== null && row.priceNok < params.minPrice) {
      return false;
    }

    if (params.maxPrice !== null && row.priceNok > params.maxPrice) {
      return false;
    }

    if (
      params.q &&
      !`${row.title} ${row.description} ${row.municipality} ${row.county}`
        .toLowerCase()
        .includes(params.q.toLowerCase())
    ) {
      return false;
    }

    if (params.availability === "open_now" && !isListingOpenNow(row.availabilityCalendar)) {
      return false;
    }

    if (!matchesBbox(row, params)) {
      return false;
    }

    if (!matchesNearby(row, params)) {
      return false;
    }

    return true;
  });

  const listingIds = filteredRows.map((row) => row.id);
  const ownerIds = [...new Set(filteredRows.map((row) => row.ownerId))];

  const [reviews, ownerBookings] = await Promise.all([
    listingIds.length
      ? prisma.review.findMany({
          where: {
            listingId: {
              in: listingIds,
            },
            moderationStatus: "APPROVED",
            reviewerRole: "HUNTER",
          },
          select: {
            listingId: true,
            rating: true,
          },
        })
      : Promise.resolve([]),
    ownerIds.length
      ? prisma.booking.findMany({
          where: {
            listing: {
              property: {
                ownerId: {
                  in: ownerIds,
                },
              },
            },
          },
          select: {
            status: true,
            listing: {
              select: {
                property: {
                  select: {
                    ownerId: true,
                  },
                },
              },
            },
          },
        })
      : Promise.resolve([]),
  ]);

  const reviewMap = new Map<string, number[]>();
  for (const review of reviews) {
    const current = reviewMap.get(review.listingId) ?? [];
    current.push(review.rating);
    reviewMap.set(review.listingId, current);
  }

  const ownerStatsMap = new Map<string, { totalBookings: number; cancelledBookings: number }>();
  for (const booking of ownerBookings) {
    const ownerId = booking.listing.property.ownerId;
    const current = ownerStatsMap.get(ownerId) ?? { totalBookings: 0, cancelledBookings: 0 };
    current.totalBookings += 1;
    if (booking.status === "CANCELLED") {
      current.cancelledBookings += 1;
    }
    ownerStatsMap.set(ownerId, current);
  }

  const results = filteredRows
    .map<ListingSearchResult>((row) => {
      const ratings = reviewMap.get(row.id) ?? [];
      const averageRating = getAverageRating(ratings);
      const trust = getTrustSummary({
        averageRating,
        reviewCount: ratings.length,
      });
      const bookingStats = ownerStatsMap.get(row.ownerId) ?? {
        totalBookings: 0,
        cancelledBookings: 0,
      };
      const hostBadge = getHostQualityBadge({
        averageRating,
        approvedReviewCount: ratings.length,
        cancelledBookings: bookingStats.cancelledBookings,
        totalBookings: bookingStats.totalBookings,
      });
      const availabilityOpen = isListingOpenNow(row.availabilityCalendar);

      return {
        id: row.id,
        slug: row.slug,
        title: row.title,
        description: row.description,
        type: row.type,
        species: row.species,
        pricingModel: row.pricingModel,
        priceNok: row.priceNok,
        instantBookEnabled: row.instantBookEnabled,
        municipality: row.municipality,
        county: row.county,
        latitude: row.latitude,
        longitude: row.longitude,
        leadPhoto: row.photos[0] ?? null,
        trustLabel: trust.label,
        trustDetail: trust.detail,
        hostBadgeLabel: hostBadge?.label ?? null,
        hostBadgeTone: hostBadge?.tone ?? null,
        averageRating,
        reviewCount: ratings.length,
        availabilityLabel: getAvailabilityLabel({
          instantBookEnabled: row.instantBookEnabled,
          availabilityCalendar: row.availabilityCalendar,
        }),
        availabilityOpen,
        distanceKm: buildNearbyDistance(row, params),
      };
    })
    .sort((left, right) => rankSearchRows(left, right, params));

  return results;
}
