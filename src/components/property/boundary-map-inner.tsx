"use client";

import L from "leaflet";
import Link from "next/link";
import {
  LayersControl,
  MapContainer,
  Marker,
  Polygon,
  ScaleControl,
  TileLayer,
  WMSTileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { useEffect } from "react";

type Point = {
  lat: number;
  lng: number;
};

type OverlayShape = {
  id: string;
  title: string;
  overlayType: string;
  polygons: Point[][];
};

type BoundaryMapProps = {
  points: Point[];
  onAddPoint: (point: Point) => void;
  onMovePoint: (index: number, point: Point) => void;
  onCenterChange?: (point: Point) => void;
  focusPoint?: Point | null;
  rightsOverlays?: OverlayShape[];
  kartverketWmsUrl?: string;
  kartverketWmsLayers?: string;
};

const norwayCenter: [number, number] = [61.0, 10.5];
const kartverketAttribution =
  '&copy; <a href="https://www.kartverket.no/">Kartverket</a>';
const osmAttribution =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

function createPointIcon(index: number) {
  return L.divIcon({
    className: "heyra-boundary-marker",
    html: `<span>${index + 1}</span>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

function colorForOverlayType(overlayType: string) {
  switch (overlayType) {
    case "FISHING_ZONE":
      return { color: "#2563eb", fillColor: "#93c5fd" };
    case "ACCESS_ZONE":
    case "ENTRY_ZONE":
      return { color: "#1d4ed8", fillColor: "#bfdbfe" };
    case "EXCLUDED_ZONE":
      return { color: "#b91c1c", fillColor: "#fecaca" };
    default:
      return { color: "#166534", fillColor: "#bbf7d0" };
  }
}

function MapInteractionHandler({
  onAddPoint,
  onCenterChange,
}: {
  onAddPoint: (point: Point) => void;
  onCenterChange?: (point: Point) => void;
}) {
  useMapEvents({
    click(event) {
      onAddPoint({
        lat: Number(event.latlng.lat.toFixed(6)),
        lng: Number(event.latlng.lng.toFixed(6)),
      });
    },
    moveend(event) {
      if (!onCenterChange) {
        return;
      }

      const center = event.target.getCenter();
      onCenterChange({
        lat: Number(center.lat.toFixed(6)),
        lng: Number(center.lng.toFixed(6)),
      });
    },
  });

  return null;
}

function MapViewportSync({
  points,
  focusPoint,
}: {
  points: Point[];
  focusPoint?: Point | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (points.length >= 3) {
      map.fitBounds(points.map((point) => [point.lat, point.lng] as [number, number]), {
        padding: [24, 24],
      });
      return;
    }

    if (points[0]) {
      map.setView([points[0].lat, points[0].lng], Math.max(map.getZoom(), 13));
      return;
    }

    if (focusPoint) {
      map.setView([focusPoint.lat, focusPoint.lng], 14);
    }
  }, [focusPoint, map, points]);

  return null;
}

export default function BoundaryMapInner({
  points,
  onAddPoint,
  onMovePoint,
  onCenterChange,
  focusPoint,
  rightsOverlays = [],
  kartverketWmsUrl,
  kartverketWmsLayers,
}: BoundaryMapProps) {
  const center: [number, number] =
    points.length > 0 ? [points[0].lat, points[0].lng] : norwayCenter;
  const polygonPositions = points.map((point) => [point.lat, point.lng] as [number, number]);

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-[1.4rem] border border-[var(--border)]">
        <MapContainer
          center={center}
          zoom={points.length > 0 ? 12 : 5}
          scrollWheelZoom
          className="heyra-map"
        >
          <LayersControl position="topright">
            <LayersControl.BaseLayer checked name="Kartverket Topo">
              <TileLayer
                attribution={kartverketAttribution}
                url="https://cache.kartverket.no/v1/wmts/1.0.0/topo/default/webmercator/{z}/{y}/{x}.png"
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="OpenStreetMap fallback">
              <TileLayer
                attribution={osmAttribution}
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
            </LayersControl.BaseLayer>
            {kartverketWmsUrl && kartverketWmsLayers ? (
              <LayersControl.Overlay checked name="Eiendomsgrenser (Kartverket)">
                <WMSTileLayer
                  url={kartverketWmsUrl}
                  layers={kartverketWmsLayers}
                  format="image/png"
                  transparent
                  attribution={kartverketAttribution}
                />
              </LayersControl.Overlay>
            ) : null}
            {rightsOverlays.map((overlay) => {
              const colors = colorForOverlayType(overlay.overlayType);
              const positions = overlay.polygons.map((polygon) =>
                polygon.map((point) => [point.lat, point.lng] as [number, number]),
              );

              return (
                <LayersControl.Overlay
                  checked
                  key={overlay.id}
                  name={`Lag: ${overlay.title}`}
                >
                  <Polygon
                    positions={positions}
                    pathOptions={{
                      color: colors.color,
                      fillColor: colors.fillColor,
                      fillOpacity: 0.2,
                      weight: 2,
                      dashArray: "6 4",
                    }}
                  />
                </LayersControl.Overlay>
              );
            })}
          </LayersControl>
          <ScaleControl imperial={false} />
          <MapViewportSync points={points} focusPoint={focusPoint} />
          <MapInteractionHandler onAddPoint={onAddPoint} onCenterChange={onCenterChange} />
          {polygonPositions.length >= 3 ? (
            <Polygon
              positions={polygonPositions}
              pathOptions={{
                color: "#1b4332",
                fillColor: "#d97706",
                fillOpacity: 0.22,
                weight: 3,
              }}
            />
          ) : null}
          {points.map((point, index) => (
            <Marker
              key={`${index}-${point.lat}-${point.lng}`}
              position={[point.lat, point.lng]}
              draggable
              icon={createPointIcon(index)}
              eventHandlers={{
                dragend(event) {
                  const latlng = event.target.getLatLng();
                  onMovePoint(index, {
                    lat: Number(latlng.lat.toFixed(6)),
                    lng: Number(latlng.lng.toFixed(6)),
                  });
                },
              }}
            />
          ))}
        </MapContainer>
      </div>
      <div className="flex flex-wrap items-center gap-3 rounded-[1.2rem] border border-[var(--border)] bg-white/75 px-4 py-3 text-sm text-[var(--muted)]">
        <span>
          Kartverket topo is the default base map, and the parcel overlay can be toggled on for cadastral context while Heyra layers show the actual offer area.
        </span>
        {points.length > 0 ? (
          <Link
            href={`https://norgeskart.no/?zoom=12&lat=${points[0].lat}&lon=${points[0].lng}&backgroundLayer=topo&panel=Seeiendom`}
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-[var(--forest)]"
          >
            Open the same area in Norgeskart
          </Link>
        ) : null}
      </div>
    </div>
  );
}
