"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { haversineDistanceKm, type NearbyFishingListing } from "@/lib/fishing-nearby";
import { getGeolocationErrorMessage, getGeolocationUnavailableMessage } from "@/lib/geolocation-client";

type PositionState = {
  latitude: number;
  longitude: number;
} | null;

export function NearbyFishingFinder({
  listings,
}: {
  listings: NearbyFishingListing[];
}) {
  const [position, setPosition] = useState<PositionState>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [instantOnly, setInstantOnly] = useState(true);

  useEffect(() => {
    void locateUser();
  }, []);

  async function locateUser() {
    const unavailableMessage = getGeolocationUnavailableMessage();
    if (unavailableMessage) {
      setError(unavailableMessage);
      return;
    }

    setIsLocating(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (nextPosition) => {
        setPosition({
          latitude: nextPosition.coords.latitude,
          longitude: nextPosition.coords.longitude,
        });
        setIsLocating(false);
      },
      () => {
        setError(getGeolocationErrorMessage());
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 15000,
      },
    );
  }

  const sortedListings = listings
    .filter((listing) => (instantOnly ? listing.instantBookEnabled : true))
    .map((listing) => ({
      ...listing,
      distanceKm: position
        ? haversineDistanceKm(position, {
            latitude: listing.latitude,
            longitude: listing.longitude,
          })
        : null,
    }))
    .sort((left, right) => {
      if (left.distanceKm === null && right.distanceKm === null) {
        if (left.instantBookEnabled !== right.instantBookEnabled) {
          return left.instantBookEnabled ? -1 : 1;
        }
        return left.priceNok - right.priceNok;
      }
      if (left.distanceKm === null) {
        return 1;
      }
      if (right.distanceKm === null) {
        return -1;
      }
      if (left.distanceKm !== right.distanceKm) {
        return left.distanceKm - right.distanceKm;
      }
      if (left.instantBookEnabled !== right.instantBookEnabled) {
        return left.instantBookEnabled ? -1 : 1;
      }
      return left.priceNok - right.priceNok;
    });

  return (
    <section className="space-y-5">
      <article className="rounded-[1.6rem] border border-[var(--border)] bg-white/80 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
          Nearby fishing
        </p>
        <h2 className="mt-3 text-2xl text-[var(--forest)]">Find a river or lake from where you are</h2>
        <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
          This mobile-first view starts with your position, highlights instant fishing offers first, and keeps the next steps short: open the offer, read the rules, then complete the licence flow.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void locateUser()}
            className="rounded-full bg-[var(--forest)] px-4 py-2 text-sm font-semibold text-white"
          >
            {isLocating ? "Checking location..." : position ? "Refresh my position" : "Use my position"}
          </button>
          <button
            type="button"
            onClick={() => setInstantOnly((current) => !current)}
            className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--foreground)]"
          >
            {instantOnly ? "Show all fishing offers" : "Show instant offers only"}
          </button>
        </div>
        {position ? (
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
            Current position: {position.latitude.toFixed(5)}, {position.longitude.toFixed(5)}
          </p>
        ) : null}
        {error ? <p className="mt-3 text-sm text-[#7f3127]">{error}</p> : null}
      </article>

      {sortedListings.length === 0 ? (
        <article className="rounded-[1.6rem] border border-[var(--border)] bg-white/80 p-6 text-sm leading-7 text-[var(--muted)]">
          No matching fishing offers are available right now.
        </article>
      ) : (
        <div className="grid gap-4">
          {sortedListings.map((listing) => (
            <article
              key={listing.id}
              className="rounded-[1.6rem] border border-[var(--border)] bg-white/80 p-6"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--amber)]">
                    {listing.instantBookEnabled ? "Instant fishing" : "Request flow"}
                  </p>
                  <h3 className="mt-2 text-2xl text-[var(--forest)]">{listing.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                    {listing.municipality}, {listing.county}
                    {listing.distanceKm !== null ? ` · ${listing.distanceKm.toFixed(1)} km away` : ""}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                    {listing.availabilityLabel} · {listing.trustLabel}
                  </p>
                  {listing.ruleSummary ? (
                    <p className="mt-2 text-sm leading-7 text-[var(--foreground)]">
                      {listing.ruleSummary}
                    </p>
                  ) : null}
                </div>
                <div className="min-w-[10rem] text-left sm:text-right">
                  <p className="text-lg font-semibold text-[var(--forest)]">
                    NOK {listing.priceNok.toLocaleString("nb-NO")}
                  </p>
                  <p className="text-sm text-[var(--muted)]">
                    {listing.instantBookEnabled
                      ? "Open and buy quickly"
                      : "Read rules and send request"}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href={`/listings/${listing.slug}`}
                  className="rounded-full bg-[var(--forest)] px-4 py-2 text-sm font-semibold text-white"
                >
                  Open offer
                </Link>
                <Link
                  href={`/listings/${listing.slug}/field`}
                  className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--foreground)]"
                >
                  Field mode
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
