export const SHARE_STORAGE_PREFIX = "heyra-share-attribution";

export type StoredShareAttribution = {
  firstTouchSource?: string;
  firstTouchCampaign?: string;
  lastTouchSource?: string;
  lastTouchCampaign?: string;
};

export function normalizeStoredShareAttribution(input: unknown): StoredShareAttribution {
  if (!input || typeof input !== "object") {
    return {};
  }

  const value = input as Record<string, unknown>;

  return {
    firstTouchSource:
      typeof value.firstTouchSource === "string" ? value.firstTouchSource.trim() : undefined,
    firstTouchCampaign:
      typeof value.firstTouchCampaign === "string" ? value.firstTouchCampaign.trim() : undefined,
    lastTouchSource:
      typeof value.lastTouchSource === "string" ? value.lastTouchSource.trim() : undefined,
    lastTouchCampaign:
      typeof value.lastTouchCampaign === "string" ? value.lastTouchCampaign.trim() : undefined,
  };
}

export function mergeShareAttribution(
  current: StoredShareAttribution,
  input: {
    source?: string;
    campaign?: string;
  },
) {
  const source = input.source?.trim() ?? "";
  const campaign = input.campaign?.trim() ?? "";

  if (!source && !campaign) {
    return current;
  }

  return {
    firstTouchSource: current.firstTouchSource || source || undefined,
    firstTouchCampaign: current.firstTouchCampaign || campaign || undefined,
    lastTouchSource: source || current.lastTouchSource,
    lastTouchCampaign: campaign || current.lastTouchCampaign,
  };
}

export function buildAttributionLabel(source?: string, campaign?: string) {
  return [source, campaign].filter(Boolean).join(" · ");
}

export function summarizeAttributedBookings(
  bookings: Array<{
    hunterAttestations: unknown;
  }>,
) {
  const firstTouch = new Map<string, { label: string; count: number }>();
  const lastTouch = new Map<string, { label: string; count: number }>();

  for (const booking of bookings) {
    const attribution = normalizeStoredShareAttribution(
      (booking.hunterAttestations as { attribution?: unknown } | null)?.attribution,
    );

    if (attribution.firstTouchSource) {
      const key = `${attribution.firstTouchSource}::${attribution.firstTouchCampaign ?? ""}`;
      const existing = firstTouch.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        firstTouch.set(key, {
          label: buildAttributionLabel(attribution.firstTouchSource, attribution.firstTouchCampaign),
          count: 1,
        });
      }
    }

    if (attribution.lastTouchSource) {
      const key = `${attribution.lastTouchSource}::${attribution.lastTouchCampaign ?? ""}`;
      const existing = lastTouch.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        lastTouch.set(key, {
          label: buildAttributionLabel(attribution.lastTouchSource, attribution.lastTouchCampaign),
          count: 1,
        });
      }
    }
  }

  return {
    firstTouch: Array.from(firstTouch.entries()).map(([key, value]) => ({ key, ...value })),
    lastTouch: Array.from(lastTouch.entries()).map(([key, value]) => ({ key, ...value })),
  };
}
