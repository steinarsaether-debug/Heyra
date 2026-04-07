"use client";

import { LayersControl, MapContainer, Polygon, ScaleControl, TileLayer, WMSTileLayer } from "react-leaflet";

type Point = {
  lat: number;
  lng: number;
};

type ListingAreaMapInnerProps = {
  points: Point[];
  parcelPoints: Point[];
  overlayTitle?: string | null;
  kartverketWmsUrl?: string;
  kartverketWmsLayers?: string;
};

const norwayCenter: [number, number] = [61.0, 10.5];
const kartverketAttribution =
  '&copy; <a href="https://www.kartverket.no/">Kartverket</a>';

export default function ListingAreaMapInner({
  points,
  parcelPoints,
  overlayTitle,
  kartverketWmsUrl,
  kartverketWmsLayers,
}: ListingAreaMapInnerProps) {
  const center: [number, number] =
    points[0] ? [points[0].lat, points[0].lng] : parcelPoints[0] ? [parcelPoints[0].lat, parcelPoints[0].lng] : norwayCenter;

  return (
    <div className="overflow-hidden rounded-[1.4rem] border border-[var(--border)]">
      <MapContainer center={center} zoom={12} scrollWheelZoom className="heyra-map">
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="Kartverket Topo">
            <TileLayer
              attribution={kartverketAttribution}
              url="https://cache.kartverket.no/v1/wmts/1.0.0/topo/default/webmercator/{z}/{y}/{x}.png"
            />
          </LayersControl.BaseLayer>
          {kartverketWmsUrl && kartverketWmsLayers ? (
            <LayersControl.Overlay checked name="Eiendomsgrense">
              <WMSTileLayer
                url={kartverketWmsUrl}
                layers={kartverketWmsLayers}
                format="image/png"
                transparent
                attribution={kartverketAttribution}
              />
            </LayersControl.Overlay>
          ) : null}
          {parcelPoints.length >= 3 ? (
            <LayersControl.Overlay checked name="Lagret eiendomsgrense">
              <Polygon
                positions={parcelPoints.map((point) => [point.lat, point.lng] as [number, number])}
                pathOptions={{
                  color: "#64748b",
                  fillColor: "#cbd5e1",
                  fillOpacity: 0.08,
                  weight: 2,
                  dashArray: "6 4",
                }}
              />
            </LayersControl.Overlay>
          ) : null}
          {points.length >= 3 ? (
            <LayersControl.Overlay checked name={overlayTitle ?? "Offentlig tilbudsområde"}>
              <Polygon
                positions={points.map((point) => [point.lat, point.lng] as [number, number])}
                pathOptions={{
                  color: "#1b4332",
                  fillColor: "#d97706",
                  fillOpacity: 0.2,
                  weight: 3,
                }}
              />
            </LayersControl.Overlay>
          ) : null}
        </LayersControl>
        <ScaleControl imperial={false} />
      </MapContainer>
    </div>
  );
}
