import { describe, expect, it } from "vitest";
import { getHostQualityBadge, getTrustSummary } from "./trust-summary";

describe("trust summary helpers", () => {
  it("returns a strong trust label for repeated high ratings", () => {
    const summary = getTrustSummary({ averageRating: 4.9, reviewCount: 12 });
    expect(summary.label).toBe("Svært høy tillit");
  });

  it("returns a host badge when the rating and cancellation thresholds are met", () => {
    const badge = getHostQualityBadge({
      averageRating: 4.9,
      approvedReviewCount: 12,
      cancelledBookings: 0,
      totalBookings: 20,
    });

    expect(badge?.label).toBe("Highly rated host");
  });

  it("returns a reliable host badge for a solid but not top-tier history", () => {
    const badge = getHostQualityBadge({
      averageRating: 4.6,
      approvedReviewCount: 6,
      cancelledBookings: 1,
      totalBookings: 20,
    });

    expect(badge?.label).toBe("Reliable host");
  });
});
