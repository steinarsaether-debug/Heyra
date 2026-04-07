import { describe, expect, it } from "vitest";
import { ServiceProviderReviewStatus } from "@prisma/client";
import { getServiceTrustBadge, getServiceTrustSummary } from "./service-trust";

describe("service trust", () => {
  it("returns a verified badge for approved reviewed providers", () => {
    const badge = getServiceTrustBadge({
      reviewStatus: ServiceProviderReviewStatus.APPROVED,
      verifiedAt: new Date(),
      yearsExperience: 2,
      publishedServices: 1,
    });

    expect(badge?.label).toBe("Verified local provider");
  });

  it("returns experienced summary for seasoned providers", () => {
    const summary = getServiceTrustSummary({
      reviewStatus: ServiceProviderReviewStatus.PENDING,
      verifiedAt: null,
      yearsExperience: 8,
      publishedServices: 2,
    });

    expect(summary).toBe("Experienced local provider");
  });
});
