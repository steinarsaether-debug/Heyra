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

const DEFAULT_WFS_URL =
  process.env.KARTVERKET_WFS_URL ??
  "https://wfs.geonorge.no/skwms1/wfs.matrikkelen-eiendomskart-teig";
const DEFAULT_REST_URL =
  process.env.KARTVERKET_REST_URL ?? "https://ws.geonorge.no/eiendom/v1";

const DEFAULT_WMS_URL =
  process.env.KARTVERKET_WMS_URL ??
  "https://wms.geonorge.no/skwms1/wms.matrikkelkart";

let cachedTypeNamePromise: Promise<string> | null = null;

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

function escapeCqlValue(value: string) {
  return value.replace(/'/g, "''");
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

function buildCqlFilter(params: ParcelSearchParams) {
  const clauses: string[] = [];

  if (params.municipalityCode) {
    clauses.push(`kommunenummer='${escapeCqlValue(params.municipalityCode)}'`);
  }

  if (params.gnr) {
    clauses.push(`gaardsnummer=${Number(params.gnr)}`);
  }

  if (params.bnr) {
    clauses.push(`bruksnummer=${Number(params.bnr)}`);
  }

  if (params.festenr) {
    clauses.push(`festenummer=${Number(params.festenr)}`);
  }

  if (params.snr) {
    clauses.push(`seksjonsnummer=${Number(params.snr)}`);
  }

  return clauses.join(" AND ");
}

async function discoverTypeName() {
  if (!cachedTypeNamePromise) {
    cachedTypeNamePromise = (async () => {
      const url = `${DEFAULT_WFS_URL}?service=WFS&request=GetCapabilities`;
      const response = await fetch(url, { cache: "no-store" });

      if (!response.ok) {
        throw new Error("Unable to discover Kartverket WFS capabilities.");
      }

      const xml = await response.text();
      const typeNames = [...xml.matchAll(/<Name>([^<]*teig[^<]*)<\/Name>/gi)].map((match) =>
        match[1]?.trim(),
      );
      const typeName = typeNames.find(Boolean);

      if (!typeName) {
        throw new Error("Unable to discover a Teig feature type from Kartverket WFS.");
      }

      return typeName;
    })();
  }

  return cachedTypeNamePromise;
}

async function fetchFeatures(params: URLSearchParams) {
  const typeName = await discoverTypeName();
  const query = new URLSearchParams({
    service: "WFS",
    request: "GetFeature",
    version: "2.0.0",
    typeNames: typeName,
    outputFormat: "application/json",
    srsName: "EPSG:4326",
    count: "25",
  });

  params.forEach((value, key) => {
    query.set(key, value);
  });

  const response = await fetch(`${DEFAULT_WFS_URL}?${query.toString()}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Kartverket parcel service did not respond successfully.");
  }

  return (await response.json()) as GeoJsonFeatureCollection;
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

function normalizeFeature(feature: GeoJsonFeature): ParcelCandidate | null {
  const properties = feature.properties ?? {};
  const municipalityCode = readString(properties, ["kommunenummer", "kommunenr"]);
  const municipalityName = readString(properties, ["kommunenavn", "navn"]);
  const gnr = readString(properties, ["gaardsnummer", "gnr"]);
  const bnr = readString(properties, ["bruksnummer", "bnr"]);
  const festenr = readString(properties, ["festenummer", "fnr"]);
  const snr = readString(properties, ["seksjonsnummer", "snr"]);
  const matrikkelnummer =
    readString(properties, ["matrikkelnummertekst", "matrikkelnummer"]) ??
    [municipalityCode, [gnr, bnr, festenr, snr].filter(Boolean).join("/")].filter(Boolean).join("-");

  if (!feature.geometry || !matrikkelnummer) {
    return null;
  }

  const polygons = geoJsonToPolygonPoints(feature.geometry);
  const center = computeCenter(polygons);

  return {
    sourceRef: String(feature.id ?? matrikkelnummer),
    title:
      municipalityName && gnr && bnr
        ? `${municipalityName} ${gnr}/${bnr}${festenr ? `/${festenr}` : ""}${snr ? `/${snr}` : ""}`
        : matrikkelnummer,
    municipalityCode,
    municipalityName,
    gnr,
    bnr,
    festenr,
    snr,
    center,
  };
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
  const values = Array.isArray(payload)
    ? payload
    : payload && typeof payload === "object"
      ? (
          (payload as Record<string, unknown>).items ??
          (payload as Record<string, unknown>).results ??
          (payload as Record<string, unknown>).eiendommer ??
          (payload as Record<string, unknown>).features ??
          []
        )
      : [];

  if (!Array.isArray(values)) {
    return [];
  }

  return values
    .map(normalizeRestCandidate)
    .filter((candidate): candidate is ParcelCandidate => Boolean(candidate));
}

async function searchParcelCandidatesViaRest(params: ParcelSearchParams) {
  const queryAttempts: string[] = [];
  const byPoint =
    Number.isFinite(params.lat) &&
    Number.isFinite(params.lng) &&
    params.lat !== null &&
    params.lng !== null;

  if (byPoint) {
    const query = new URLSearchParams({
      lat: String(params.lat),
      lon: String(params.lng),
    });
    queryAttempts.push(`${DEFAULT_REST_URL}/punkt?${query.toString()}`);
    queryAttempts.push(`${DEFAULT_REST_URL}/lokalisering?${query.toString()}`);
    queryAttempts.push(`${DEFAULT_REST_URL}/eiendommer?${query.toString()}`);
  } else {
    const matrikkel = new URLSearchParams();

    if (params.municipalityCode) {
      matrikkel.set("kommunenummer", params.municipalityCode);
    }
    if (params.gnr) {
      matrikkel.set("gaardsnummer", params.gnr);
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

    if ([...matrikkel.keys()].length > 0) {
      const query = matrikkel.toString();
      queryAttempts.push(`${DEFAULT_REST_URL}/matrikkelnummer?${query}`);
      queryAttempts.push(`${DEFAULT_REST_URL}/eiendommer?${query}`);
      queryAttempts.push(`${DEFAULT_REST_URL}/lokalisering?${query}`);
    }
  }

  for (const url of queryAttempts) {
    const payload = await tryRestRequest(url);
    const candidates = normalizeRestCandidates(payload);

    if (candidates.length > 0) {
      return candidates;
    }
  }

  return [];
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

  const byPoint =
    Number.isFinite(params.lat) &&
    Number.isFinite(params.lng) &&
    params.lat !== null &&
    params.lng !== null;

  const query = new URLSearchParams();

  if (byPoint) {
    const epsilon = 0.0008;
    query.set(
      "bbox",
      `${params.lng! - epsilon},${params.lat! - epsilon},${params.lng! + epsilon},${params.lat! + epsilon},EPSG:4326`,
    );
  } else {
    const cqlFilter = buildCqlFilter(params);

    if (!cqlFilter) {
      throw new Error(
        "Provide either a map position or a matrikkel reference to search for parcels.",
      );
    }

    query.set("CQL_FILTER", cqlFilter);
  }

  const collection = await fetchFeatures(query);

  return applyMatchMetadata(
    (collection.features ?? [])
      .map(normalizeFeature)
      .filter((feature): feature is ParcelCandidate => Boolean(feature)),
  );
}

export async function importParcelGeometry(sourceRef: string, fallback?: ParcelSearchParams) {
  let collection = await fetchFeatures(new URLSearchParams({ featureID: sourceRef }));
  let feature = (collection.features ?? [])[0] ?? null;

  if (!feature && fallback) {
    const rankedCandidates = await searchParcelCandidates(fallback);
    const bestCandidate = rankedCandidates[0];

    if (bestCandidate?.sourceRef) {
      collection = await fetchFeatures(new URLSearchParams({ featureID: bestCandidate.sourceRef }));
      feature = (collection.features ?? [])[0] ?? null;
    }
  }

  if (!feature?.geometry) {
    throw new Error("Unable to load parcel geometry from Kartverket.");
  }

  const parcel = normalizeFeature(feature);

  if (!parcel) {
    throw new Error("Unable to normalize the Kartverket parcel response.");
  }

  const polygons = geoJsonToPolygonPoints(feature.geometry);

  return {
    parcel,
    polygons,
    center: computeCenter(polygons),
  };
}
