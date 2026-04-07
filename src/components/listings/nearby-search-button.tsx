"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { getGeolocationErrorMessage, getGeolocationUnavailableMessage } from "@/lib/geolocation-client";
import { buildListingSearchQueryString, parseListingSearchParams } from "@/lib/listing-search";

export function NearbySearchButton() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function searchNearMyLocation() {
    const unavailableMessage = getGeolocationUnavailableMessage();
    if (unavailableMessage) {
      setError(unavailableMessage);
      return;
    }

    setError(null);
    setIsLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const current = parseListingSearchParams(searchParams);
        const query = buildListingSearchQueryString({
          ...current,
          nearLat: Number(position.coords.latitude.toFixed(5)),
          nearLng: Number(position.coords.longitude.toFixed(5)),
          radiusKm: current.radiusKm || 75,
        });

        router.push(`/listings?${query}`);
        setIsLoading(false);
      },
      () => {
        setError(getGeolocationErrorMessage());
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 15000,
      },
    );
  }

  function clearNearby() {
    const current = parseListingSearchParams(searchParams);
    const query = buildListingSearchQueryString({
      ...current,
      nearLat: null,
      nearLng: null,
    });

    router.push(`/listings${query ? `?${query}` : ""}`);
  }

  const activeNearby = searchParams.get("nearLat") && searchParams.get("nearLng");

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={() => void searchNearMyLocation()}
        className="rounded-full bg-[var(--forest)] px-5 py-3 text-sm font-semibold text-white"
      >
        {isLoading ? "Checking my location..." : "Search near me"}
      </button>
      {activeNearby ? (
        <button
          type="button"
          onClick={clearNearby}
          className="rounded-full border border-[var(--border)] px-5 py-3 text-sm font-semibold text-[var(--foreground)]"
        >
          Clear nearby search
        </button>
      ) : null}
      {error ? <p className="text-sm text-[#7f3127]">{error}</p> : null}
    </div>
  );
}
