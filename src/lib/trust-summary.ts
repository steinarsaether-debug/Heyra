export function getTrustSummary({
  averageRating,
  reviewCount,
}: {
  averageRating: number | null;
  reviewCount: number;
}) {
  if (!averageRating || reviewCount === 0) {
    return {
      label: "No trust history yet",
      detail: "No completed-trip reviews have been approved yet.",
    };
  }

  if (reviewCount >= 10 && averageRating >= 4.8) {
    return {
      label: "Highly trusted",
      detail: "Strong pattern of positive completed-trip reviews.",
    };
  }

  if (reviewCount >= 5 && averageRating >= 4) {
    return {
      label: "Established trust",
      detail: "Consistent review history across completed trips.",
    };
  }

  if (reviewCount >= 2) {
    return {
      label: "Early trust signal",
      detail: "Some approved review history is now available.",
    };
  }

  return {
    label: "First trust signal",
    detail: "A small amount of review history is available so far.",
  };
}

export type HostQualityBadge = {
  label: string;
  detail: string;
  tone: "forest" | "amber";
};

export function getHostQualityBadge({
  averageRating,
  approvedReviewCount,
  cancelledBookings,
  totalBookings,
}: {
  averageRating: number | null;
  approvedReviewCount: number;
  cancelledBookings: number;
  totalBookings: number;
}): HostQualityBadge | null {
  if (!averageRating || approvedReviewCount < 3 || totalBookings === 0) {
    return null;
  }

  const cancellationRate = cancelledBookings / totalBookings;

  if (averageRating >= 4.8 && cancellationRate < 0.02) {
    return {
      label: "Highly rated host",
      detail: "Based on review score and a very low cancellation rate.",
      tone: "forest",
    };
  }

  if (averageRating >= 4.5 && approvedReviewCount >= 5 && cancellationRate < 0.08) {
    return {
      label: "Reliable host",
      detail: "Consistent ratings and a low cancellation rate across completed trips.",
      tone: "amber",
    };
  }

  if (averageRating >= 4.2 && cancellationRate < 0.15) {
    return {
      label: "Consistent host",
      detail: "A steady first record of positive completed-trip hosting.",
      tone: "amber",
    };
  }

  return null;
}
