import { describe, expect, it } from "vitest";
import { listingDraftSchema } from "./listing-schema";

describe("listingDraftSchema", () => {
  it("accepts a valid listing draft", () => {
    const parsed = listingDraftSchema.safeParse({
      type: "HUNTING",
      governanceModel: "VALD_MANAGED",
      coApprovalRequired: true,
      governanceNotes: "This hunting area is coordinated through a shared vald representative.",
      title: "Innlandet elk terrain",
      description: "A detailed and practical listing description that explains terrain, access, and expected hunting conditions.",
      species: ["ELG"],
      pricingModel: "PER_DAY",
      priceNok: 2500,
      maxGroupSize: 3,
      minNights: 2,
      photoUrls: ["https://example.com/photo.jpg"],
      instantBookEnabled: false,
      cancellationPolicy: "MODERATE",
      quota: {
        summary: "One elk slot may be available within the local quota.",
        availabilitySummary: "Adult allocation depends on the final vald meeting.",
        permitNotes: "Final permit allocation is confirmed before arrival.",
        reportingNotes: "Harvest reporting is required the same day.",
        reportingResponsibility: "The vald representative files the final quota follow-up.",
      },
      rules: {
        speciesRestrictions: "",
        gearRules: "",
        bagLimitNotes: "",
        areaNotes: "",
        requiresNationalFishingLicense: false,
      },
      availability: {
        seasonNotes: "Open after the first frost.",
        blockedRanges: [],
      },
    });

    expect(parsed.success).toBe(true);
  });

  it("requires the extended quota fields to stay valid strings", () => {
    const parsed = listingDraftSchema.safeParse({
      type: "HUNTING",
      governanceModel: "VALD_MANAGED",
      coApprovalRequired: true,
      governanceNotes: "Shared vald approval is required before the hunt is fully locked in.",
      title: "Trysil elk terrain",
      description: "A practical description that explains access roads, hunt rhythm, and how the shared area is coordinated.",
      species: ["ELG"],
      pricingModel: "PER_DAY",
      priceNok: 2500,
      maxGroupSize: 2,
      minNights: 2,
      photoUrls: ["https://example.com/photo.jpg"],
      instantBookEnabled: false,
      cancellationPolicy: "MODERATE",
      quota: {},
      rules: {
        speciesRestrictions: "",
        gearRules: "",
        bagLimitNotes: "",
        areaNotes: "",
        requiresNationalFishingLicense: false,
      },
      availability: {
        seasonNotes: "",
        blockedRanges: [],
      },
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.quota.availabilitySummary).toBe("");
      expect(parsed.data.quota.reportingResponsibility).toBe("");
    }
  });
});
