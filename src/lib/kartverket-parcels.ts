import { geoJsonToPolygonPoints, type GeoJsonShape, type MapPoint } from "@/lib/geometry";

type ParcelSearchParams = {
  municipalityCode?: string | null;
  gnr?: string | null;
  bnr?: string | null;
  festenr?: string | null;
  snr?: string | null;
  lat?: number | null;
  lng?: number | null;
};

export type ParcelCandidate = {
  sourceRef: string;
  title: string;
  municipalityCode?: string | null;
  municipalityName?: string | null;
  gnr?: string | null;
  bnr?: string | null;
  festenr?: string | null;
  snr?: string | null;
  center?: MapPoint | null;
  polygons?: MapPoint[][];
  matchScore?: number;
  exactMatch?: boolean;
  matchReason?: string;
};

type GeoJsonFeature = {
  id?: string | number;
  geometry?: GeoJsonShape | null;
  properties?: Record<string, unknown>;
};

type GeoJsonFeatureCollection = {
  features?: GeoJsonFeature[];
};

const DEFAULT_REST_URL =
  process.env.KARTVERKET_REST_URL ?? "https://ws.geonorge.no/eiendom/v1";

const DEFAULT_WMS_URL =
  process.env.KARTVERKET_WMS_URL ??
  "https://wms.geonorge.no/skwms1/wms.matrikkelkart";

function readString(
  properties: Record<string, unknown> | undefined,
  keys: string[],
) {
  for (const key of keys) {
    const value = properties?.[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }

    if (typeof value === "number") {
      return String(value);
    }
  }

  return null;
}

function asNullablePoint(lat?: number | null, lng?: number | null) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return { lat: Number(lat), lng: Number(lng) };
}

function computeCenter(polygons: MapPoint[][]) {
  const points = polygons.flat();

  if (points.length === 0) {
    return null;
  }

  const lat = points.reduce((sum, point) => sum + point.lat, 0) / points.length;
  const lng = points.reduce((sum, point) => sum + point.lng, 0) / points.length;

  return { lat, lng };
}

function normalizeRestPoint(value: unknown) {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const lat = Number(candidate.lat ?? candidate.latitude ?? candidate.nord ?? candidate.y);
  const lng = Number(candidate.lng ?? candidate.longitude ?? candidate.ost ?? candidate.x);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return { lat, lng };
}

function normalizeNumericField(value?: string | null) {
  if (!value) {
    return null;
  }

  const numeric = Number.parseInt(value, 10);

  return Number.isFinite(numeric) ? String(numeric) : value.trim();
}

function computeMatchScore(candidate: ParcelCandidate, params: ParcelSearchParams) {
  let score = 0;
  const reasons: string[] = [];
  const municipalityCode = normalizeNumericField(params.municipalityCode);
  const gnr = normalizeNumericField(params.gnr);
  const bnr = normalizeNumericField(params.bnr);
  const festenr = normalizeNumericField(params.festenr);
  const snr = normalizeNumericField(params.snr);

  if (municipalityCode && normalizeNumericField(candidate.municipalityCode) === municipalityCode) {
    score += 30;
    reasons.push("kommunenummer");
  }

  if (gnr && normalizeNumericField(candidate.gnr) === gnr) {
    score += 25;
    reasons.push("gårdsnummer");
  }

  if (bnr && normalizeNumericField(candidate.bnr) === bnr) {
    score += 25;
    reasons.push("bruksnummer");
  }

  if (festenr) {
    if (normalizeNumericField(candidate.festenr) === festenr) {
      score += 10;
      reasons.push("festenummer");
    } else {
      score -= 8;
    }
  }

  if (snr) {
    if (normalizeNumericField(candidate.snr) === snr) {
      score += 10;
      reasons.push("seksjonsnummer");
    } else {
      score -= 8;
    }
  }

  return {
    score,
    exactMatch:
      Boolean(municipalityCode && gnr && bnr) &&
      normalizeNumericField(candidate.municipalityCode) === municipalityCode &&
      normalizeNumericField(candidate.gnr) === gnr &&
      normalizeNumericField(candidate.bnr) === bnr &&
      (!festenr || normalizeNumericField(candidate.festenr) === festenr) &&
      (!snr || normalizeNumericField(candidate.snr) === snr),
    reasons,
  };
}

async function tryRestRequest(url: string) {
  try {
    const response = await fetch(url, { cache: "no-store" });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as unknown;
  } catch {
    return null;
  }
}

function normalizeRestCandidate(raw: unknown): ParcelCandidate | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const record = raw as Record<string, unknown>;
  const municipalityCode = readString(record, [
    "kommunenummer",
    "kommunenr",
    "municipalityCode",
  ]);
  const municipalityName = readString(record, [
    "kommunenavn",
    "municipalityName",
    "navn",
  ]);
  const gnr = readString(record, ["gaardsnummer", "gnr", "gårdsnummer"]);
  const bnr = readString(record, ["bruksnummer", "bnr"]);
  const festenr = readString(record, ["festenummer", "fnr", "festenr"]);
  const snr = readString(record, ["seksjonsnummer", "snr"]);
  const title =
    readString(record, ["matrikkelnummertekst", "matrikkelnummer", "label", "tekst"]) ??
    [municipalityName, [gnr, bnr, festenr, snr].filter(Boolean).join("/")].filter(Boolean).join(" ");
  const sourceRef =
    readString(record, ["id", "objectid", "fid", "featureId", "matrikkelnummer"]) ?? title;

  if (!title || !sourceRef) {
    return null;
  }

  return {
    sourceRef,
    title,
    municipalityCode,
    municipalityName,
    gnr,
    bnr,
    festenr,
    snr,
    center:
      normalizeRestPoint(record.posisjon) ??
      normalizeRestPoint(record.position) ??
      normalizeRestPoint(record.center) ??
      normalizeRestPoint(record.senter),
  };
}

function normalizeRestCandidates(payload: unknown) {
  const values =
    payload && typeof payload === "object"
      ? ((payload as Record<string, unknown>).features ??
          (payload as Record<string, unknown>).eiendom ??
          [])
      : [];

  if (!Array.isArray(values)) {
    return [];
  }

  return values
    .map((value) => {
      if (value && typeof value === "object" && "properties" in value) {
        const feature = value as Record<string, unknown>;
        const candidate = normalizeRestCandidate(feature.properties);
        const polygons =
          feature.geometry && typeof feature.geometry === "object"
            ? geoJsonToPolygonPoints(feature.geometry as GeoJsonShape)
            : [];

        return candidate
          ? {
              ...candidate,
              center: candidate.center ?? computeCenter(polygons),
              polygons,
            }
          : null;
      }

      return normalizeRestCandidate(value);
    })
    .filter((candidate): candidate is ParcelCandidate => Boolean(candidate));
}

async function searchParcelCandidatesViaRest(params: ParcelSearchParams) {
  const byPoint =
    Number.isFinite(params.lat) &&
    Number.isFinite(params.lng) &&
    params.lat !== null &&
    params.lng !== null;

  if (byPoint) {
    const query = new URLSearchParams({
      nord: String(params.lat),
      ost: String(params.lng),
      koordsys: "4258",
      utkoordsys: "4258",
      radius: "250",
      maksTreff: "25",
    });
    const payload = await tryRestRequest(`${DEFAULT_REST_URL}/punkt/omrader?${query.toString()}`);
    return normalizeRestCandidates(payload);
  }

  const matrikkel = new URLSearchParams({
    omrade: "true",
    utkoordsys: "4258",
  });

  if (params.municipalityCode) {
    matrikkel.set("kommunenummer", params.municipalityCode);
  }
  if (params.gnr) {
    matrikkel.set("gardsnummer", params.gnr);
  }
  if (params.bnr) {
    matrikkel.set("bruksnummer", params.bnr);
  }
  if (params.festenr) {
    matrikkel.set("festenummer", params.festenr);
  }
  if (params.snr) {
    matrikkel.set("seksjonsnummer", params.snr);
  }

  if (![...matrikkel.keys()].some((key) => key !== "omrade" && key !== "utkoordsys")) {
    return [];
  }

  const payload = await tryRestRequest(`${DEFAULT_REST_URL}/geokoding?${matrikkel.toString()}`);
  return normalizeRestCandidates(payload);
}

export function getKartverketOverlayConfig() {
  return {
    wmsUrl: DEFAULT_WMS_URL,
    wmsLayers: process.env.KARTVERKET_WMS_LAYERS ?? "eiendomskart",
    attribution: '&copy; <a href="https://www.kartverket.no/">Kartverket</a>',
  };
}

export async function searchParcelCandidates(params: ParcelSearchParams) {
  const restCandidates = await searchParcelCandidatesViaRest(params);
  const applyMatchMetadata = (candidates: ParcelCandidate[]) =>
    candidates
      .map((candidate) => {
        const match = computeMatchScore(candidate, params);

        return {
          ...candidate,
          matchScore: match.score,
          exactMatch: match.exactMatch,
          matchReason: match.reasons.length > 0 ? `Treff på ${match.reasons.join(", ")}` : null,
        };
      })
      .sort((left, right) => {
        const scoreDiff = (right.matchScore ?? 0) - (left.matchScore ?? 0);

        if (scoreDiff !== 0) {
          return scoreDiff;
        }

        return left.title.localeCompare(right.title, "nb");
      });

  if (restCandidates.length > 0) {
    return applyMatchMetadata(restCandidates);
  }
  return [];
}

export async function importParcelGeometry(sourceRef: string, fallback?: ParcelSearchParams) {
  const query = new URLSearchParams({
    omrade: "true",
    utkoordsys: "4258",
  });

  if (sourceRef) {
    query.set("matrikkelnummer", sourceRef);
  } else if (fallback) {
    if (fallback.municipalityCode) {
      query.set("kommunenummer", fallback.municipalityCode);
    }
    if (fallback.gnr) {
      query.set("gardsnummer", fallback.gnr);
    }
    if (fallback.bnr) {
      query.set("bruksnummer", fallback.bnr);
    }
    if (fallback.festenr) {
      query.set("festenummer", fallback.festenr);
    }
    if (fallback.snr) {
      query.set("seksjonsnummer", fallback.snr);
    }
  }

  const payload = await tryRestRequest(`${DEFAULT_REST_URL}/geokoding?${query.toString()}`);
  const values =
    payload && typeof payload === "object" && Array.isArray((payload as Record<string, unknown>).features)
      ? ((payload as Record<string, unknown>).features as Array<Record<string, unknown>>)
      : [];
  const feature = values[0] ?? null;

  if (!feature?.geometry || !feature.properties) {
    throw new Error("Unable to load parcel geometry from Kartverket.");
  }

  const parcel = normalizeRestCandidate(feature.properties);

  if (!parcel) {
    throw new Error("Unable to normalize the Kartverket parcel response.");
  }

  const polygons = geoJsonToPolygonPoints(feature.geometry as GeoJsonShape);

  return {
    parcel,
    polygons,
    center: computeCenter(polygons),
  };
}
