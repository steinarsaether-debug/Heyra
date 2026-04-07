export function getTrustSummary({
  averageRating,
  reviewCount,
}: {
  averageRating: number | null;
  reviewCount: number;
}) {
  if (!averageRating || reviewCount === 0) {
    return {
      label: "Ingen tillitshistorikk ennå",
      detail: "Ingen vurderinger fra fullførte turer er godkjent ennå.",
    };
  }

  if (reviewCount >= 10 && averageRating >= 4.8) {
    return {
      label: "Svært høy tillit",
      detail: "Tydelig mønster av positive vurderinger fra fullførte turer.",
    };
  }

  if (reviewCount >= 5 && averageRating >= 4) {
    return {
      label: "Etablert tillit",
      detail: "Jevn vurderingshistorikk på tvers av fullførte turer.",
    };
  }

  if (reviewCount >= 2) {
    return {
      label: "Tidlig tillitssignal",
      detail: "Det finnes nå noe godkjent vurderingshistorikk.",
    };
  }

  return {
    label: "Første tillitssignal",
    detail: "Det finnes foreløpig en liten mengde vurderingshistorikk.",
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
      detail: "Basert på vurderingsscore og svært lav avbestillingsrate.",
      tone: "forest",
    };
  }

  if (averageRating >= 4.5 && approvedReviewCount >= 5 && cancellationRate < 0.08) {
    return {
      label: "Reliable host",
      detail: "Jevne vurderinger og lav avbestillingsrate på tvers av fullførte turer.",
      tone: "amber",
    };
  }

  if (averageRating >= 4.2 && cancellationRate < 0.15) {
    return {
      label: "Consistent host",
      detail: "Et stabilt første grunnlag av positive fullførte vertskapsturer.",
      tone: "amber",
    };
  }

  return null;
}
