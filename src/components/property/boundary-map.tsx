"use client";

import dynamic from "next/dynamic";

type BoundaryMapProps = {
  points: Array<{ lat: number; lng: number }>;
  onAddPoint: (point: { lat: number; lng: number }) => void;
  onMovePoint: (index: number, point: { lat: number; lng: number }) => void;
};

const BoundaryMapInner = dynamic(() => import("./boundary-map-inner"), {
  ssr: false,
});

export function BoundaryMap(props: BoundaryMapProps) {
  return <BoundaryMapInner {...props} />;
}
