import { describe, expect, it } from "vitest";
import { ListingType, PricingModel, Species } from "@prisma/client";
import {
  buildListingSearchQueryString,
  getAvailabilityLabel,
  parseListingSearchParams,
  rankSearchRows,
  type ListingSearchResult,
} from "./listing-search";

describe("parseListingSearchParams", () => {
  it("parses supported filter params", () => {
    const params = parseListingSearchParams({
      q: "trysil",
      type: "HUNTING",
      species: "ELG",
      municipality: "Trysil",
      minPrice: "1000",
      maxPrice: "2500",
      availability: "open_now",
      nearLat: "61.12",
      nearLng: "11.44",
      radiusKm: "30",
      north: "62.0",
      south: "60.0",
      east: "12.0",
      west: "10.0",
      view: "map",
    });

    expect(params.type).toBe(ListingType.HUNTING);
    expect(params.species).toBe(Species.ELG);
    expect(params.minPrice).toBe(1000);
    expect(params.maxPrice).toBe(2500);
    expect(params.availability).toBe("open_now");
    expect(params.radiusKm).toBe(30);
    expect(params.view).toBe("map");
  });

  it("drops empty and invalid values back to defaults", () => {
    const params = parseListingSearchParams({
      type: "NOPE",
      species: "NOPE",
      minPrice: "abc",
      radiusKm: "-2",
    });

    expect(params.type).toBeNull();
    expect(params.species).toBeNull();
    expect(params.minPrice).toBeNull();
    expect(params.radiusKm).toBe(1);
  });
});

describe("buildListingSearchQueryString", () => {
  it("omits default values from the URL", () => {
    const query = buildListingSearchQueryString({
      q: "fishing",
      availability: "all",
      view: "list",
      type: null,
    });

    expect(query).toBe("q=fishing");
  });
});

describe("getAvailabilityLabel", () => {
  it("marks blocked listings clearly", () => {
    expect(
      getAvailabilityLabel({
        instantBookEnabled: true,
        availabilityCalendar: {
          blockedRanges: [
            {
              startDate: "2026-04-01",
              endDate: "2026-04-30",
              label: "Maintenance",
            },
          ],
          seasonNotes: "",
        },
        now: new Date("2026-04-06T12:00:00.000Z"),
      }),
    ).toBe("Temporarily blocked");
  });
});

describe("rankSearchRows", () => {
  const base: ListingSearchResult = {
    id: "1",
    slug: "one",
    title: "One",
    description: "Desc",
    type: ListingType.FISHING,
    species: [Species.LAKS],
    pricingModel: PricingModel.PER_DAY,
    priceNok: 1000,
    instantBookEnabled: false,
    municipality: "A",
    county: "B",
    latitude: 61,
    longitude: 10,
    leadPhoto: null,
    trustLabel: "Trust",
    trustDetail: "Detail",
    hostBadgeLabel: null,
    hostBadgeTone: null,
    averageRating: 4.2,
    reviewCount: 2,
    availabilityLabel: "Open",
    availabilityOpen: true,
    distanceKm: 12,
  };

  it("prefers closer nearby results", () => {
    const left = { ...base, id: "left", distanceKm: 5 };
    const right = { ...base, id: "right", distanceKm: 15 };

    expect(
      rankSearchRows(left, right, {
        q: "",
        type: null,
        species: null,
        municipality: "",
        minPrice: null,
        maxPrice: null,
        availability: "all",
        nearLat: 61,
        nearLng: 10,
        radiusKm: 75,
        north: null,
        south: null,
        east: null,
        west: null,
        view: "list",
      }),
    ).toBeLessThan(0);
  });
});
