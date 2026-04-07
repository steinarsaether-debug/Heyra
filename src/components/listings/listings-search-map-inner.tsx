"use client";

import L from "leaflet";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayersControl,
  MapContainer,
  Marker,
  Popup,
  ScaleControl,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import {
  buildListingSearchQueryString,
  type ListingSearchParams,
  type ListingSearchResult,
} from "@/lib/listing-search";

const norwayCenter: [number, number] = [61.0, 10.5];
const kartverketAttribution =
  '&copy; <a href="https://www.kartverket.no/">Kartverket</a>';
const osmAttribution =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

function createListingIcon(type: ListingSearchResult["type"]) {
  const isFishing = type === "FISHING";

  return L.divIcon({
    className: "heyra-search-marker",
    html: `<span>${isFishing ? "F" : "J"}</span>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

function SearchAreaControl({
  onBoundsChange,
}: {
  onBoundsChange: (bounds: { north: number; south: number; east: number; west: number }) => void;
}) {
  const map = useMap();

  useMapEvents({
    moveend() {
      const bounds = map.getBounds();
      onBoundsChange({
        north: Number(bounds.getNorth().toFixed(5)),
        south: Number(bounds.getSouth().toFixed(5)),
        east: Number(bounds.getEast().toFixed(5)),
        west: Number(bounds.getWest().toFixed(5)),
      });
    },
    zoomend() {
      const bounds = map.getBounds();
      onBoundsChange({
        north: Number(bounds.getNorth().toFixed(5)),
        south: Number(bounds.getSouth().toFixed(5)),
        east: Number(bounds.getEast().toFixed(5)),
        west: Number(bounds.getWest().toFixed(5)),
      });
    },
  });

  return null;
}

function FitResults({
  results,
}: {
  results: ListingSearchResult[];
}) {
  const map = useMap();

  useEffect(() => {
    const points = results
      .filter((result) => result.latitude !== null && result.longitude !== null)
      .map((result) => [result.latitude as number, result.longitude as number] as [number, number]);

    if (points.length === 0) {
      return;
    }

    if (points.length === 1) {
      map.setView(points[0], 9);
      return;
    }

    map.fitBounds(points, {
      padding: [32, 32],
    });
  }, [map, results]);

  return null;
}

export default function ListingsSearchMapInner({
  results,
  params,
}: {
  results: ListingSearchResult[];
  params: ListingSearchParams;
}) {
  const router = useRouter();
  const [pendingBounds, setPendingBounds] = useState<{
    north: number;
    south: number;
    east: number;
    west: number;
  } | null>(
    params.north !== null &&
      params.south !== null &&
      params.east !== null &&
      params.west !== null
      ? {
          north: params.north,
          south: params.south,
          east: params.east,
          west: params.west,
        }
      : null,
  );

  function searchThisArea() {
    if (!pendingBounds) {
      return;
    }

    const query = buildListingSearchQueryString({
      ...params,
      ...pendingBounds,
      view: "map",
    });

    router.push(`/listings?${query}`);
  }

  function clearMapArea() {
    const query = buildListingSearchQueryString({
      ...params,
      north: null,
      south: null,
      east: null,
      west: null,
      view: "map",
    });

    router.push(`/listings${query ? `?${query}` : ""}`);
  }

  const center: [number, number] =
    results.find((result) => result.latitude !== null && result.longitude !== null)
      ? [
          results.find((result) => result.latitude !== null && result.longitude !== null)!
            .latitude as number,
          results.find((result) => result.latitude !== null && result.longitude !== null)!
            .longitude as number,
        ]
      : norwayCenter;

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-[1.4rem] border border-[var(--border)]">
        <MapContainer center={center} zoom={6} scrollWheelZoom className="heyra-map">
          <LayersControl position="topright">
            <LayersControl.BaseLayer checked name="Kartverket Topo">
              <TileLayer
                attribution={kartverketAttribution}
                url="https://cache.kartverket.no/v1/wmts/1.0.0/topo/default/webmercator/{z}/{y}/{x}.png"
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="OpenStreetMap fallback">
              <TileLayer attribution={osmAttribution} url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            </LayersControl.BaseLayer>
          </LayersControl>
          <ScaleControl imperial={false} />
          <FitResults results={results} />
          <SearchAreaControl onBoundsChange={setPendingBounds} />
          {results
            .filter((result) => result.latitude !== null && result.longitude !== null)
            .map((result) => (
              <Marker
                key={result.id}
                position={[result.latitude as number, result.longitude as number]}
                icon={createListingIcon(result.type)}
              >
                <Popup>
                  <div className="space-y-2">
                    <p className="font-semibold">{result.title}</p>
                    <p className="text-sm">
                      {result.municipality}, {result.county}
                    </p>
                    <p className="text-sm">{result.availabilityLabel}</p>
                    <p className="text-sm">NOK {result.priceNok.toLocaleString("nb-NO")}</p>
                    <Link href={`/listings/${result.slug}`} className="font-semibold text-[#1b4332]">
                      Open listing
                    </Link>
                  </div>
                </Popup>
              </Marker>
            ))}
        </MapContainer>
      </div>
      <div className="flex flex-wrap items-center gap-3 rounded-[1.2rem] border border-[var(--border)] bg-white/75 px-4 py-3 text-sm text-[var(--muted)]">
        <span>
          Pan or zoom the map, then search the visible area to narrow the public results to that part of Norway.
        </span>
        <button
          type="button"
          onClick={searchThisArea}
          className="rounded-full bg-[var(--forest)] px-4 py-2 font-semibold text-white"
        >
          Search this area
        </button>
        {(params.north !== null &&
          params.south !== null &&
          params.east !== null &&
          params.west !== null) ? (
          <button
            type="button"
            onClick={clearMapArea}
            className="rounded-full border border-[var(--border)] px-4 py-2 font-semibold text-[var(--foreground)]"
          >
            Clear map area
          </button>
        ) : null}
      </div>
    </div>
  );
}
