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
  useMapEvents,
} from "react-leaflet";

type BoundaryMapProps = {
  points: Array<{ lat: number; lng: number }>;
  onAddPoint: (point: { lat: number; lng: number }) => void;
  onMovePoint: (index: number, point: { lat: number; lng: number }) => void;
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

function MapClickHandler({
  onAddPoint,
}: {
  onAddPoint: (point: { lat: number; lng: number }) => void;
}) {
  useMapEvents({
    click(event) {
      onAddPoint({
        lat: Number(event.latlng.lat.toFixed(6)),
        lng: Number(event.latlng.lng.toFixed(6)),
      });
    },
  });

  return null;
}

export default function BoundaryMapInner({
  points,
  onAddPoint,
  onMovePoint,
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
              <TileLayer attribution={osmAttribution} url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            </LayersControl.BaseLayer>
          </LayersControl>
          <ScaleControl imperial={false} />
          <MapClickHandler onAddPoint={onAddPoint} />
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
        <span>Kartverket topo tiles are the default background so the boundary step feels closer to the Norwegian cadastral context.</span>
        {points.length > 0 ? (
          <Link
            href={`https://norgeskart.no/#!?project=seeiendom&layers=1002&zoom=12&lat=${points[0].lat}&lon=${points[0].lng}`}
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
