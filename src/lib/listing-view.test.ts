import { describe, expect, it } from "vitest";
import { buildListingSlug, getListingChecklist } from "./listing-view";

describe("buildListingSlug", () => {
  it("builds a stable slug from a title", () => {
    expect(buildListingSlug("Innlandet Forest Hunt")).toBe("innlandet-forest-hunt");
  });

  it("falls back when the title has no slug-safe characters", () => {
    expect(buildListingSlug("!!!", "abc123")).toBe("listing-abc123");
  });
});

describe("getListingChecklist", () => {
  it("marks a complete listing as complete", () => {
    const checklist = getListingChecklist({
      title: "Innlandet Forest Hunt",
      description: "A detailed listing description for a hunting offer.",
      species: ["ELG"],
      photos: ["/uploads/listings/demo/photo.jpg"],
      priceNok: 2500,
    });

    expect(checklist.completed).toBe(checklist.total);
  });
});
