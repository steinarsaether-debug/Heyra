export type MapPoint = {
  lat: number;
  lng: number;
};

export const MAX_EDITOR_BOUNDARY_POINTS = 80;

type GeoJsonPolygon = {
  type: "Polygon";
  coordinates: number[][][];
};

type GeoJsonMultiPolygon = {
  type: "MultiPolygon";
  coordinates: number[][][][];
};

export type GeoJsonShape = GeoJsonPolygon | GeoJsonMultiPolygon;

export function normalizeRing(points: MapPoint[]) {
  if (points.length === 0) {
    return [];
  }

  const normalized = [...points];
  const first = normalized[0];
  const last = normalized[normalized.length - 1];

  if (first.lat !== last.lat || first.lng !== last.lng) {
    normalized.push(first);
  }

  return normalized;
}

export function buildPolygonWkt(points: MapPoint[]) {
  const normalized = normalizeRing(points);

  return `POLYGON((${normalized.map((point) => `${point.lng} ${point.lat}`).join(", ")}))`;
}

export function buildMultiPolygonWkt(polygons: MapPoint[][]) {
  const rings = polygons
    .filter((polygon) => polygon.length >= 3)
    .map((polygon) => {
      const normalized = normalizeRing(polygon);
      return `((${normalized.map((point) => `${point.lng} ${point.lat}`).join(", ")}))`;
    });

  return `MULTIPOLYGON(${rings.join(", ")})`;
}

export function geometryJsonToPoints(geometryJson: string | null) {
  if (!geometryJson) {
    return [];
  }

  const geometry = JSON.parse(geometryJson) as {
    type?: "Polygon" | "MultiPolygon";
    coordinates?: number[][][] | number[][][][];
  };
  const ring =
    geometry.type === "MultiPolygon"
      ? ((geometry.coordinates as number[][][][] | undefined)?.[0]?.[0] ?? [])
      : ((geometry.coordinates as number[][][] | undefined)?.[0] ?? []);
  const openRing = ring.length > 1 ? ring.slice(0, -1) : ring;

  return openRing.map(([lng, lat]) => ({ lat, lng }));
}

export function geoJsonToPolygonPoints(shape: GeoJsonShape) {
  if (shape.type === "Polygon") {
    return [shape.coordinates[0] ?? []].filter((ring) => ring.length >= 3).map((ring) =>
      ring.map(([lng, lat]) => ({ lat, lng })),
    );
  }

  return shape.coordinates
    .map((polygon) => polygon[0] ?? [])
    .filter((ring) => ring.length >= 3)
    .map((ring) => ring.map(([lng, lat]) => ({ lat, lng })));
}

export function geometryJsonToPolygons(geometryJson: string | null) {
  if (!geometryJson) {
    return [];
  }

  const geometry = JSON.parse(geometryJson) as GeoJsonShape;
  return geoJsonToPolygonPoints(geometry);
}

export function simplifyPointsForEditor(points: MapPoint[], maxPoints = MAX_EDITOR_BOUNDARY_POINTS) {
  if (points.length <= maxPoints) {
    return points;
  }

  const result: MapPoint[] = [];
  const usedIndexes = new Set<number>();

  for (let slot = 0; slot < maxPoints; slot += 1) {
    const index = Math.round((slot * (points.length - 1)) / Math.max(maxPoints - 1, 1));

    if (usedIndexes.has(index)) {
      continue;
    }

    usedIndexes.add(index);
    result.push(points[index]);
  }

  if (result.length < 3) {
    return points.slice(0, 3);
  }

  return result;
}
