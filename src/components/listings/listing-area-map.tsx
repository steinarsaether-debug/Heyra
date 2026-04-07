"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { getKartverketOverlayConfig } from "@/lib/kartverket-parcels";

type Point = {
  lat: number;
  lng: number;
};

const ListingAreaMapInner = dynamic(() => import("./listing-area-map-inner"), {
  ssr: false,
});

const overlayConfig = getKartverketOverlayConfig();

export function ListingAreaMap({
  listingId,
}: {
  listingId: string;
}) {
  const [data, setData] = useState<{
    points: Point[];
    parcelPoints: Point[];
    source: string;
    publicOverlayTitle?: string | null;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch(`/api/listings/${listingId}/area`);
        const json = (await response.json()) as {
          error?: string;
          points?: Point[];
          parcelPoints?: Point[];
          source?: string;
          publicOverlayTitle?: string | null;
        };

        if (!response.ok) {
          throw new Error(json.error || "Vi klarte ikke å laste områdekartet.");
        }

        if (!cancelled) {
          setData({
            points: json.points ?? [],
            parcelPoints: json.parcelPoints ?? [],
            source: json.source ?? "parcel-boundary",
            publicOverlayTitle: json.publicOverlayTitle ?? null,
          });
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Vi klarte ikke å laste områdekartet.",
          );
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [listingId]);

  if (error) {
    return <p className="text-sm text-[#8c3b19]">{error}</p>;
  }

  if (!data) {
    return <p className="text-sm text-[var(--muted)]">Laster områdekart...</p>;
  }

  return (
    <div className="space-y-3">
      <ListingAreaMapInner
        points={data.points}
        parcelPoints={data.parcelPoints}
        overlayTitle={data.publicOverlayTitle}
        kartverketWmsUrl={overlayConfig.wmsUrl}
        kartverketWmsLayers={overlayConfig.wmsLayers}
      />
      <div className="rounded-2xl border border-[var(--border)] bg-[#fbf8f1] px-4 py-3 text-sm leading-7 text-[var(--muted)]">
        {data.source === "rights-overlay"
          ? "Det grønne området viser det offentlige tilbudsområdet. Den stiplede grensen viser lagret eiendomsgrense som bakgrunnskontekst."
          : "Kartet viser lagret eiendomsgrense. Hvis jakt- eller fiskerettene avviker, må grunneier publisere et eget offentlig tilbudslag."}
      </div>
    </div>
  );
}
