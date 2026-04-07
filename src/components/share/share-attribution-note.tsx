"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  mergeShareAttribution,
  normalizeStoredShareAttribution,
  SHARE_STORAGE_PREFIX,
} from "@/lib/share-attribution";

export function ShareAttributionNote({
  listingId,
}: {
  listingId: string;
}) {
  const searchParams = useSearchParams();
  const [shareSource, setShareSource] = useState("");
  const [shareCampaign, setShareCampaign] = useState("");

  useEffect(() => {
    const storageKey = `${SHARE_STORAGE_PREFIX}:${listingId}`;
    const sourceFromUrl = searchParams.get("share_source")?.trim() ?? "";
    const campaignFromUrl = searchParams.get("share_campaign")?.trim() ?? "";

    if (sourceFromUrl || campaignFromUrl) {
      const saved = normalizeStoredShareAttribution(
        JSON.parse(window.localStorage.getItem(storageKey) ?? "{}"),
      );
      const merged = mergeShareAttribution(saved, {
        source: sourceFromUrl,
        campaign: campaignFromUrl,
      });
      setShareSource(merged.lastTouchSource ?? "");
      setShareCampaign(merged.lastTouchCampaign ?? "");
      window.localStorage.setItem(
        storageKey,
        JSON.stringify(merged),
      );
      return;
    }

    const saved = window.localStorage.getItem(storageKey);

    if (!saved) {
      return;
    }

    try {
      const parsed = normalizeStoredShareAttribution(JSON.parse(saved));
      setShareSource(parsed.lastTouchSource ?? "");
      setShareCampaign(parsed.lastTouchCampaign ?? "");
    } catch {
      return;
    }
  }, [listingId, searchParams]);

  if (!shareSource) {
    return null;
  }

  return (
    <div className="rounded-[1.5rem] border border-[#d0dfd6] bg-[#eef5f0] p-6 text-sm leading-7 text-[#29543a]">
      You opened this listing from a shared link
      {shareCampaign ? ` (${shareCampaign})` : ""}. If you book, Heyra can attribute the booking to that promotion.
    </div>
  );
}
