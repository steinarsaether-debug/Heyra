"use client";

import { useMemo, useState } from "react";
import { getGeolocationErrorMessage, getGeolocationUnavailableMessage } from "@/lib/geolocation-client";

type Point = {
  lat: number;
  lng: number;
};

function isPointInsidePolygon(point: Point, polygon: Point[]) {
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng;
    const yi = polygon[i].lat;
    const xj = polygon[j].lng;
    const yj = polygon[j].lat;

    const intersects =
      yi > point.lat !== yj > point.lat &&
      point.lng < ((xj - xi) * (point.lat - yi)) / (yj - yi || Number.EPSILON) + xi;

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
}

export function FishingAreaWarning({
  listingId,
  areaNotes,
  title = "Fishing area awareness",
  description = "Use this on the riverbank or in the mountains to sanity-check whether you are still inside the saved area for this licence.",
}: {
  listingId: string;
  areaNotes: string;
  title?: string;
  description?: string;
}) {
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isWatching, setIsWatching] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);
  const warningTone = useMemo(
    () => (message?.toLowerCase().includes("outside") ? "warning" : "ok"),
    [message],
  );

  async function checkPosition(enableWatch = false) {
    const unavailableMessage = getGeolocationUnavailableMessage();
    if (unavailableMessage) {
      setError(unavailableMessage);
      return;
    }

    setIsWorking(true);
    setError(null);

    const response = await fetch(`/api/listings/${listingId}/area`);
    const data = (await response.json()) as { error?: string; points?: Point[] };

    if (!response.ok || !data.points || data.points.length < 3) {
      setError(data.error ?? "No saved area boundary is available for this listing yet.");
      setIsWorking(false);
      return;
    }

    const handlePosition = (position: GeolocationPosition) => {
      const point = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
      const inside = isPointInsidePolygon(point, data.points ?? []);
      setMessage(
        inside
          ? "You appear to be inside the saved fishing area."
          : "You appear to be outside the saved fishing area. Check the map, the local signs, and the area notes before continuing.",
      );
      setIsWorking(false);
    };

    const handleError = () => {
      setError(getGeolocationErrorMessage());
      setIsWorking(false);
    };

    if (enableWatch) {
      const id = navigator.geolocation.watchPosition(handlePosition, handleError, {
        enableHighAccuracy: true,
        maximumAge: 10000,
      });
      setWatchId(id);
      setIsWatching(true);
      return;
    }

    navigator.geolocation.getCurrentPosition(handlePosition, handleError, {
      enableHighAccuracy: true,
      maximumAge: 10000,
    });
  }

  function stopWatching() {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
    }
    setWatchId(null);
    setIsWatching(false);
  }

  return (
    <article className="rounded-[1.5rem] border border-[var(--border)] bg-white/70 p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
        {title}
      </p>
      <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
        {description}
      </p>
      {areaNotes ? (
        <p className="mt-3 rounded-2xl border border-[var(--border)] bg-[#fbf8f1] px-4 py-3 text-sm leading-7 text-[var(--foreground)]">
          {areaNotes}
        </p>
      ) : null}
      {message ? (
        <p
          className={`mt-4 rounded-2xl px-4 py-3 text-sm leading-7 ${
            warningTone === "warning"
              ? "border border-[#e7d6ae] bg-[#fff8eb] text-[#6e5630]"
              : "border border-[#b9d7c7] bg-[#eef8f1] text-[#1f5c3d]"
          }`}
        >
          {message}
        </p>
      ) : null}
      {error ? <p className="mt-4 text-sm text-[#7f3127]">{error}</p> : null}
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => checkPosition(false)}
          disabled={isWorking}
          className="rounded-full bg-[var(--forest)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
        >
          {isWorking ? "Checking..." : "Check my position"}
        </button>
        {!isWatching ? (
          <button
            type="button"
            onClick={() => checkPosition(true)}
            className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--foreground)]"
          >
            Watch my position
          </button>
        ) : (
          <button
            type="button"
            onClick={stopWatching}
            className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--foreground)]"
          >
            Stop watching
          </button>
        )}
      </div>
    </article>
  );
}
