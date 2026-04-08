"use client";

import { PointerEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BoundaryMap } from "@/components/property/boundary-map";
import { RightsOverlayEditor } from "@/components/property/rights-overlay-editor";
import { getKartverketOverlayConfig } from "@/lib/kartverket-parcels";

type BoundaryEditorProps = {
  propertyId: string;
  initialParcelSearch?: {
    municipalityCode?: string;
    gnr?: string;
    bnr?: string;
    festenr?: string;
    snr?: string;
  };
};

type BoundaryPoint = {
  lat: string;
  lng: string;
};

type ParcelCandidate = {
  sourceRef: string;
  title: string;
  municipalityCode?: string | null;
  municipalityName?: string | null;
  gnr?: string | null;
  bnr?: string | null;
  festenr?: string | null;
  snr?: string | null;
  center?: { lat: number; lng: number } | null;
  polygons?: Array<Array<{ lat: number; lng: number }>>;
  matchScore?: number;
  exactMatch?: boolean;
  matchReason?: string | null;
};

type RightsOverlay = {
  id: string;
  title: string;
  description: string | null;
  overlayType: string;
  visibility: string;
  provenance: string;
  confidence: string;
  polygons: Array<Array<{ lat: number; lng: number }>>;
};

const initialPoints: BoundaryPoint[] = [
  { lat: "", lng: "" },
  { lat: "", lng: "" },
  { lat: "", lng: "" },
];

const previewWidth = 460;
const previewHeight = 320;
const previewPadding = 28;
const overlayConfig = getKartverketOverlayConfig();

function describeParcelMatch(candidate: ParcelCandidate) {
  if (candidate.exactMatch) {
    return {
      badge: "Eksakt matrikkeltreff",
      tone: "border-[#cfe5d7] bg-[#eef8f1] text-[#24553a]",
      detail:
        "Kartverket svarte med et treff som stemmer med kommunenummer, gårdsnummer og bruksnummer.",
    };
  }

  if ((candidate.matchScore ?? 0) >= 50) {
    return {
      badge: "Sannsynlig treff",
      tone: "border-[#e7d6ae] bg-[#fff8eb] text-[#6e5630]",
      detail:
        candidate.matchReason ??
        "Kartverket svarte med et nært matrikkeltreff. Kontroller gjerne at teigen faktisk er riktig før import.",
    };
  }

  return {
    badge: "Treff i området",
    tone: "border-[#d8dde8] bg-[#f6f8fb] text-[#48566a]",
    detail:
      candidate.matchReason ??
      "Dette treffet kommer fra området eller kartpunktet, men bør gjennomgås manuelt før bruk.",
  };
}

function normalizeInitialParcelSearch(initialParcelSearch?: BoundaryEditorProps["initialParcelSearch"]) {
  return {
    municipalityCode: initialParcelSearch?.municipalityCode ?? "",
    gnr: initialParcelSearch?.gnr ?? "",
    bnr: initialParcelSearch?.bnr ?? "",
    festenr: initialParcelSearch?.festenr ?? "",
    snr: initialParcelSearch?.snr ?? "",
  };
}

export function BoundaryEditor({ propertyId, initialParcelSearch }: BoundaryEditorProps) {
  const router = useRouter();
  const [points, setPoints] = useState<BoundaryPoint[]>(initialPoints);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingExisting, setIsLoadingExisting] = useState(true);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [boundarySource, setBoundarySource] = useState("MANUAL");
  const [boundaryImportedAt, setBoundaryImportedAt] = useState<string | null>(null);
  const [boundarySourceLabel, setBoundarySourceLabel] = useState<string | null>(null);
  const [parcelSearch, setParcelSearch] = useState(() => normalizeInitialParcelSearch(initialParcelSearch));
  const [parcelResults, setParcelResults] = useState<ParcelCandidate[]>([]);
  const [isSearchingParcel, setIsSearchingParcel] = useState(false);
  const [isImportingParcel, setIsImportingParcel] = useState<string | null>(null);
  const [rightsOverlays, setRightsOverlays] = useState<RightsOverlay[]>([]);
  const [focusPoint, setFocusPoint] = useState<{ lat: number; lng: number } | null>(null);
  const [searchPreviewPolygons, setSearchPreviewPolygons] = useState<
    Array<Array<{ lat: number; lng: number }>>
  >([]);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const filledCount = useMemo(
    () => points.filter((point) => point.lat.trim() && point.lng.trim()).length,
    [points],
  );

  const parsedPoints = useMemo(
    () =>
      points
        .map((point, index) => ({
          index,
          lat: Number(point.lat),
          lng: Number(point.lng),
        }))
        .filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng)),
    [points],
  );

  const previewModel = useMemo(() => {
    if (parsedPoints.length === 0) {
      return null;
    }

    const lats = parsedPoints.map((point) => point.lat);
    const lngs = parsedPoints.map((point) => point.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const latSpan = Math.max(maxLat - minLat, 0.0005);
    const lngSpan = Math.max(maxLng - minLng, 0.0005);
    const innerWidth = previewWidth - previewPadding * 2;
    const innerHeight = previewHeight - previewPadding * 2;

    return {
      minLat,
      maxLat,
      minLng,
      maxLng,
      latSpan,
      lngSpan,
      innerWidth,
      innerHeight,
    };
  }, [parsedPoints]);

  const previewPoints = useMemo(() => {
    if (!previewModel) {
      return [];
    }

    return parsedPoints.map((point) => {
      const x =
        previewPadding +
        ((point.lng - previewModel.minLng) / previewModel.lngSpan) * previewModel.innerWidth;
      const y =
        previewHeight -
        previewPadding -
        ((point.lat - previewModel.minLat) / previewModel.latSpan) * previewModel.innerHeight;

      return {
        ...point,
        x,
        y,
      };
    });
  }, [parsedPoints, previewModel]);

  const polygonPath = useMemo(() => {
    if (previewPoints.length < 2) {
      return "";
    }

    return previewPoints.map((point) => `${point.x},${point.y}`).join(" ");
  }, [previewPoints]);

  useEffect(() => {
    let cancelled = false;

    async function loadBoundaryContext() {
      try {
        const [boundaryResponse, overlayResponse] = await Promise.all([
          fetch(`/api/properties/${propertyId}/boundary`),
          fetch(`/api/properties/${propertyId}/rights-overlays`),
        ]);

        const boundaryData = (await boundaryResponse.json()) as {
          error?: string;
          points?: Array<{ lat: number; lng: number }>;
          boundarySource?: string;
          boundaryImportedAt?: string | null;
          boundarySourceLabel?: string | null;
        };
        const overlayData = (await overlayResponse.json()) as {
          error?: string;
          overlays?: RightsOverlay[];
        };

        if (!boundaryResponse.ok) {
          throw new Error(boundaryData.error || "Vi klarte ikke å laste grensene.");
        }

        if (!overlayResponse.ok) {
          throw new Error(overlayData.error || "Vi klarte ikke å laste lagene.");
        }

        if (cancelled) {
          return;
        }

        if (boundaryData.points && boundaryData.points.length >= 3) {
          setPoints(
            boundaryData.points.map((point) => ({
              lat: String(point.lat),
              lng: String(point.lng),
            })),
          );
          setMapCenter(boundaryData.points[0] ?? null);
          setFocusPoint(boundaryData.points[0] ?? null);
        }

        setBoundarySource(boundaryData.boundarySource ?? "MANUAL");
        setBoundaryImportedAt(boundaryData.boundaryImportedAt ?? null);
        setBoundarySourceLabel(boundaryData.boundarySourceLabel ?? null);
        setRightsOverlays(overlayData.overlays ?? []);
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Vi klarte ikke å laste grensestegene.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoadingExisting(false);
        }
      }
    }

    loadBoundaryContext();

    return () => {
      cancelled = true;
    };
  }, [propertyId]);

  function updatePoint(index: number, key: keyof BoundaryPoint, value: string) {
    setPoints((current) =>
      current.map((point, currentIndex) =>
        currentIndex === index ? { ...point, [key]: value } : point,
      ),
    );
  }

  function addPoint() {
    setPoints((current) => [...current, { lat: "", lng: "" }]);
  }

  function addPointFromMap(point: { lat: number; lng: number }) {
    setPoints((current) => [
      ...current,
      { lat: point.lat.toFixed(6), lng: point.lng.toFixed(6) },
    ]);
    setMapCenter(point);
    setFocusPoint(point);
  }

  function removePoint(index: number) {
    setPoints((current) => current.filter((_, currentIndex) => currentIndex !== index));
  }

  function updatePointFromPreview(index: number, clientX: number, clientY: number) {
    if (!svgRef.current || !previewModel) {
      return;
    }

    const rect = svgRef.current.getBoundingClientRect();
    const x = Math.min(Math.max(clientX - rect.left, previewPadding), previewWidth - previewPadding);
    const y = Math.min(Math.max(clientY - rect.top, previewPadding), previewHeight - previewPadding);

    const lng =
      previewModel.minLng +
      ((x - previewPadding) / previewModel.innerWidth) * previewModel.lngSpan;
    const lat =
      previewModel.minLat +
      ((previewHeight - previewPadding - y) / previewModel.innerHeight) * previewModel.latSpan;

    setPoints((current) =>
      current.map((point, currentIndex) =>
        currentIndex === index
          ? { lat: lat.toFixed(6), lng: lng.toFixed(6) }
          : point,
      ),
    );
  }

  function handlePreviewPointerMove(event: PointerEvent<SVGSVGElement>) {
    if (draggingIndex === null) {
      return;
    }

    updatePointFromPreview(draggingIndex, event.clientX, event.clientY);
  }

  function movePointFromMap(index: number, point: { lat: number; lng: number }) {
    setPoints((current) =>
      current.map((currentPoint, currentIndex) =>
        currentIndex === index
          ? { lat: point.lat.toFixed(6), lng: point.lng.toFixed(6) }
          : currentPoint,
      ),
    );
  }

  async function handleSave() {
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/properties/${propertyId}/boundary`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          points: points.filter((point) => point.lat.trim() && point.lng.trim()),
        }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Vi klarte ikke å lagre grensen.");
      }

      setSuccess("Grensen er lagret.");
      router.push(`/dashboard/properties/${propertyId}`);
      router.refresh();
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Vi klarte ikke å lagre grensen.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function searchParcel(mode: "center" | "matrikkel") {
    setError(null);
    setSuccess(null);
    setIsSearchingParcel(true);

    try {
      const params = new URLSearchParams();

      if (mode === "center") {
        if (!mapCenter) {
          throw new Error(
            "Flytt kartet eller legg inn minst ett punkt før du søker på området i kartet.",
          );
        }

        params.set("lat", String(mapCenter.lat));
        params.set("lng", String(mapCenter.lng));
      } else {
        if (!parcelSearch.gnr.trim() || !parcelSearch.bnr.trim()) {
          throw new Error("Oppgi minst gårdsnummer og bruksnummer for matrikkelsøk.");
        }

        Object.entries(parcelSearch).forEach(([key, value]) => {
          if (value.trim()) {
            params.set(key, value.trim());
          }
        });
      }

      const response = await fetch(`/api/properties/parcel-search?${params.toString()}`);
      const data = (await response.json()) as {
        error?: string;
        results?: ParcelCandidate[];
      };

      if (!response.ok) {
        throw new Error(data.error || "Kartverket-søket svarte ikke som forventet.");
      }

      const results = data.results ?? [];
      setParcelResults(results);
      if (results[0]?.center) {
        setMapCenter(results[0].center);
        setFocusPoint(results[0].center);
      }
      if (results[0]?.polygons?.length) {
        setSearchPreviewPolygons(results[0].polygons);
      }
      if (results.length === 0) {
        setSuccess("Ingen teiger ble funnet. Du kan fortsatt tegne grensen manuelt.");
      }
    } catch (searchError) {
      setError(
        searchError instanceof Error
          ? searchError.message
          : "Vi klarte ikke å søke i Kartverket-data akkurat nå.",
      );
    } finally {
      setIsSearchingParcel(false);
    }
  }

  async function importParcel(candidate: ParcelCandidate) {
    setError(null);
    setSuccess(null);
    setIsImportingParcel(candidate.sourceRef);

    try {
      const response = await fetch(`/api/properties/${propertyId}/parcel-import`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(candidate),
      });
      const data = (await response.json()) as {
        error?: string;
        points?: Array<{ lat: number; lng: number }>;
        parcel?: ParcelCandidate;
        importedPolygonCount?: number;
        importedAreaHectares?: number | null;
        areaDifferencePercent?: number | null;
      };

      if (!response.ok) {
        throw new Error(data.error || "Vi klarte ikke å importere teigen.");
      }

      if (data.points && data.points.length >= 3) {
        const filteredPoints = data.points.filter(
          (point) => Number.isFinite(point.lat) && Number.isFinite(point.lng),
        );
        setPoints(
          filteredPoints.map((point) => ({
            lat: String(point.lat),
            lng: String(point.lng),
          })),
        );
        setMapCenter(filteredPoints[0] ?? null);
        setFocusPoint(filteredPoints[0] ?? null);
      }
      setSearchPreviewPolygons([]);

      setBoundarySource("KARTVERKET_IMPORT");
      setBoundaryImportedAt(new Date().toISOString());
      setBoundarySourceLabel(data.parcel?.title ?? candidate.title);
      const importedAreaText =
        typeof data.importedAreaHectares === "number"
          ? ` Kartverket beregnet omtrent ${new Intl.NumberFormat("nb-NO", {
              minimumFractionDigits: data.importedAreaHectares >= 100 ? 0 : 1,
              maximumFractionDigits: data.importedAreaHectares >= 100 ? 1 : 2,
            }).format(data.importedAreaHectares)} ha.`
          : "";
      const differenceText =
        typeof data.areaDifferencePercent === "number" && data.areaDifferencePercent >= 10
          ? ` Avviket mot oppgitt areal er omtrent ${data.areaDifferencePercent}%.`
          : "";
      setSuccess(
        data.importedPolygonCount && data.importedPolygonCount > 1
          ? `Den storste teigen er hentet inn som arbeidsutgangspunkt. Juster gjerne videre hvis jakt- eller fiskerettene avviker fra eiendomsgrensen eller om matrikkelen bestar av flere teiger.${importedAreaText}${differenceText}`
          : `Teigen er hentet inn som utgangspunkt. Juster gjerne videre hvis jakt- eller fiskerettene avviker fra eiendomsgrensen.${importedAreaText}${differenceText}`,
      );
      router.refresh();
    } catch (importError) {
      setError(
        importError instanceof Error
          ? importError.message
          : "Vi klarte ikke å importere teigen.",
      );
    } finally {
      setIsImportingParcel(null);
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
          Kart og eiendomsgrense
        </p>
        <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
          Klikk i kartet for å legge til punkter manuelt, eller bruk Kartverket-søk for å hente inn en teig som utgangspunkt. Parcelgrensen er bare matrikkel-kontekst. Jakt- og fiskerett kan fortsatt avvike.
        </p>

        <div className="mt-5">
          <BoundaryMap
            points={parsedPoints.map((point) => ({ lat: point.lat, lng: point.lng }))}
            onAddPoint={addPointFromMap}
            onMovePoint={movePointFromMap}
            onCenterChange={setMapCenter}
            focusPoint={focusPoint}
            searchPreviewPolygons={searchPreviewPolygons}
            rightsOverlays={rightsOverlays}
            kartverketWmsUrl={overlayConfig.wmsUrl}
            kartverketWmsLayers={overlayConfig.wmsLayers}
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-3 text-sm text-[var(--muted)]">
          <div className="rounded-full border border-[var(--border)] bg-white px-4 py-2">
            {isLoadingExisting ? "Laster eksisterende grense..." : "Kartet er klart"}
          </div>
          <div className="rounded-full border border-[var(--border)] bg-white px-4 py-2">
            Kartsentrum: {mapCenter ? `${mapCenter.lat.toFixed(4)}, ${mapCenter.lng.toFixed(4)}` : "flytt kartet for å sette søkepunkt"}
          </div>
          <div className="rounded-full border border-[var(--border)] bg-white px-4 py-2">
            Kilde:{" "}
            {boundarySource === "KARTVERKET_IMPORT"
              ? boundarySourceLabel ?? "Kartverket-import"
              : "Manuell tegning"}
          </div>
        </div>
      </section>

      <section className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
          Hent teig fra Kartverket
        </p>
        <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
          Søk enten ved kartets sentrum eller med matrikkelreferanse. Dette henter teigen som et arbeidsutgangspunkt. Du kan fortsatt justere manuelt etterpå.
        </p>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr]">
          <article className="rounded-2xl border border-[var(--border)] p-4">
            <p className="text-sm font-semibold text-[var(--foreground)]">Søk ved kartets sentrum</p>
            <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
              Praktisk når du allerede står i riktig område på kartet.
            </p>
            <button
              type="button"
              onClick={() => searchParcel("center")}
              disabled={isSearchingParcel}
              className="mt-4 rounded-full bg-[var(--forest)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {isSearchingParcel ? "Søker..." : "Finn teig ved kartet"}
            </button>
          </article>

          <article className="rounded-2xl border border-[var(--border)] p-4">
            <p className="text-sm font-semibold text-[var(--foreground)]">Søk med matrikkelreferanse</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <input
                placeholder="Kommunenummer"
                value={parcelSearch.municipalityCode}
                onChange={(event) =>
                  setParcelSearch((current) => ({
                    ...current,
                    municipalityCode: event.target.value,
                  }))
                }
                className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm"
              />
              <input
                placeholder="Gårdsnummer"
                value={parcelSearch.gnr}
                onChange={(event) =>
                  setParcelSearch((current) => ({ ...current, gnr: event.target.value }))
                }
                className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm"
              />
              <input
                placeholder="Bruksnummer"
                value={parcelSearch.bnr}
                onChange={(event) =>
                  setParcelSearch((current) => ({ ...current, bnr: event.target.value }))
                }
                className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm"
              />
              <input
                placeholder="Festenummer (valgfritt)"
                value={parcelSearch.festenr}
                onChange={(event) =>
                  setParcelSearch((current) => ({
                    ...current,
                    festenr: event.target.value,
                  }))
                }
                className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm"
              />
              <input
                placeholder="Seksjonsnummer (valgfritt)"
                value={parcelSearch.snr}
                onChange={(event) =>
                  setParcelSearch((current) => ({ ...current, snr: event.target.value }))
                }
                className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm sm:col-span-2"
              />
            </div>
            <button
              type="button"
              onClick={() => searchParcel("matrikkel")}
              disabled={isSearchingParcel}
              className="mt-4 rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] disabled:opacity-60"
            >
              {isSearchingParcel ? "Søker..." : "Søk på matrikkel"}
            </button>
          </article>
        </div>

        {parcelResults.length > 0 ? (
          <div className="mt-5 space-y-3">
            {parcelResults.map((candidate) => (
              <div
                key={candidate.sourceRef}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--border)] px-4 py-4"
              >
                <div className="space-y-2">
                  <p className="font-semibold text-[var(--foreground)]">{candidate.title}</p>
                  {(() => {
                    const match = describeParcelMatch(candidate);

                    return (
                      <p
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${match.tone}`}
                      >
                        {match.badge}
                      </p>
                    );
                  })()}
                  <p className="text-sm text-[var(--muted)]">
                    {candidate.municipalityCode ? `Kommune ${candidate.municipalityCode}` : "Kartverket"} ·{" "}
                    {candidate.gnr && candidate.bnr
                      ? `gnr ${candidate.gnr} / bnr ${candidate.bnr}`
                      : "teig funnet i området"}
                  </p>
                  <p className="text-sm text-[var(--muted)]">{describeParcelMatch(candidate).detail}</p>
                </div>
                <button
                  type="button"
                  onClick={() => importParcel(candidate)}
                  disabled={isImportingParcel === candidate.sourceRef}
                  className="rounded-full bg-[var(--amber)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] disabled:opacity-60"
                >
                  {isImportingParcel === candidate.sourceRef ? "Importerer..." : "Bruk denne teigen"}
                </button>
              </div>
            ))}
          </div>
        ) : null}

        {boundaryImportedAt ? (
          <p className="mt-4 text-sm text-[var(--muted)]">
            Siste Kartverket-import: {new Date(boundaryImportedAt).toLocaleString("nb-NO")}
            {boundarySourceLabel ? ` · ${boundarySourceLabel}` : ""}
          </p>
        ) : null}
      </section>

      <section className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
          Visual boundary board
        </p>
        <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
          Bruk dette brettet til å forstå formen mens du skriver. Når du allerede har punkter lagt inn, kan du dra markørene for å finjustere dem.
        </p>

        <div className="mt-5 overflow-hidden rounded-[1.4rem] border border-[var(--border)] bg-[#f4f0e5]">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${previewWidth} ${previewHeight}`}
            className="h-[320px] w-full touch-none"
            onPointerMove={handlePreviewPointerMove}
            onPointerUp={() => setDraggingIndex(null)}
            onPointerLeave={() => setDraggingIndex(null)}
          >
            <rect x="0" y="0" width={previewWidth} height={previewHeight} fill="#f4f0e5" />
            {Array.from({ length: 6 }).map((_, index) => (
              <line
                key={`v-${index}`}
                x1={previewPadding + (index * (previewWidth - previewPadding * 2)) / 5}
                y1={previewPadding}
                x2={previewPadding + (index * (previewWidth - previewPadding * 2)) / 5}
                y2={previewHeight - previewPadding}
                stroke="rgba(16,42,33,0.08)"
              />
            ))}
            {Array.from({ length: 5 }).map((_, index) => (
              <line
                key={`h-${index}`}
                x1={previewPadding}
                y1={previewPadding + (index * (previewHeight - previewPadding * 2)) / 4}
                x2={previewWidth - previewPadding}
                y2={previewPadding + (index * (previewHeight - previewPadding * 2)) / 4}
                stroke="rgba(16,42,33,0.08)"
              />
            ))}

            {polygonPath ? (
              <polygon
                points={polygonPath}
                fill="rgba(217,119,6,0.20)"
                stroke="rgba(27,67,50,0.85)"
                strokeWidth="3"
              />
            ) : null}

            {previewPoints.map((point, index) => (
              <g key={`${point.index}-${index}`}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="9"
                  fill="#1b4332"
                  onPointerDown={(event) => {
                    event.preventDefault();
                    setDraggingIndex(point.index);
                  }}
                />
                <text
                  x={point.x}
                  y={point.y + 4}
                  fill="#f5f2ea"
                  fontSize="10"
                  textAnchor="middle"
                >
                  {point.index + 1}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </section>

      <RightsOverlayEditor
        propertyId={propertyId}
        propertyBoundaryPoints={parsedPoints.map((point) => ({
          lat: point.lat,
          lng: point.lng,
        }))}
        overlays={rightsOverlays}
        onOverlaysChange={setRightsOverlays}
        onStatus={({ error: nextError, success: nextSuccess }) => {
          setError(nextError ?? null);
          setSuccess(nextSuccess ?? null);
          if (nextSuccess) {
            router.refresh();
          }
        }}
      />

      <section className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
          Boundary points
        </p>
        <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
          Enter the corner points in order around the property edge. You do not need to repeat the first point; the system closes the shape for you.
        </p>

        <div className="mt-5 space-y-4">
          {points.map((point, index) => (
            <div
              key={`${index}-${point.lat}-${point.lng}`}
              className="grid gap-3 rounded-2xl border border-[var(--border)] p-4 sm:grid-cols-[1fr_1fr_auto]"
            >
              <div className="space-y-2">
                <label htmlFor={`lat-${index}`} className="text-sm font-semibold text-[var(--foreground)]">
                  Point {index + 1} latitude
                </label>
                <input
                  id={`lat-${index}`}
                  type="number"
                  step="0.000001"
                  value={point.lat}
                  onChange={(event) => updatePoint(index, "lat", event.target.value)}
                  className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-base outline-none transition focus:border-[var(--amber)]"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor={`lng-${index}`} className="text-sm font-semibold text-[var(--foreground)]">
                  Point {index + 1} longitude
                </label>
                <input
                  id={`lng-${index}`}
                  type="number"
                  step="0.000001"
                  value={point.lng}
                  onChange={(event) => updatePoint(index, "lng", event.target.value)}
                  className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-base outline-none transition focus:border-[var(--amber)]"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => removePoint(index)}
                  disabled={points.length <= 3}
                  className="rounded-full border border-[var(--border)] px-4 py-3 text-sm text-[var(--muted)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={addPoint}
            className="rounded-full border border-[var(--border)] px-5 py-3 text-sm font-semibold text-[var(--foreground)]"
          >
            Add another point
          </button>
          <div className="rounded-full border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--muted)]">
            {filledCount} point{filledCount === 1 ? "" : "s"} filled in
          </div>
        </div>
      </section>

      <section className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
          Før du lagrer
        </p>
        <ul className="mt-4 space-y-3 text-sm leading-7 text-[var(--foreground)]">
          <li className="rounded-2xl border border-[var(--border)] px-4 py-3">
            Gå rundt grensen i én retning, enten med eller mot klokken.
          </li>
          <li className="rounded-2xl border border-[var(--border)] px-4 py-3">
            Hvis jakt- eller fiskerettene er mindre enn eiendommen, opprett et eget Heyra-lag for det faktiske tilbudsområdet.
          </li>
          <li className="rounded-2xl border border-[var(--border)] px-4 py-3">
            Hvis Kartverket-dataene virker unøyaktige, kan du fortsatt lagre en manuell versjon og markere rettighetene som omtrentelige i eiendomsoppsettet.
          </li>
        </ul>
      </section>

      {error ? (
        <p className="rounded-2xl bg-[#fff1eb] px-4 py-3 text-sm text-[#8c3b19]" role="alert">
          {error}
        </p>
      ) : null}

      {success ? (
        <p className="rounded-2xl bg-[#edf8ef] px-4 py-3 text-sm text-[#21542e]" role="status">
          {success}
        </p>
      ) : null}

      <button
        type="button"
        onClick={handleSave}
        disabled={isSubmitting}
        className="rounded-full bg-[var(--forest)] px-5 py-3 text-sm font-semibold text-[var(--background)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Lagrer grense..." : "Lagre grense"}
      </button>
    </div>
  );
}
