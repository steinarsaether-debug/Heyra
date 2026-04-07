"use client";

import { PointerEvent, useMemo, useRef, useState } from "react";

type OverlayPoint = {
  lat: string;
  lng: string;
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

type RightsOverlayEditorProps = {
  propertyId: string;
  propertyBoundaryPoints: Array<{ lat: number; lng: number }>;
  overlays: RightsOverlay[];
  onOverlaysChange: (overlays: RightsOverlay[]) => void;
  onStatus: (status: { error?: string | null; success?: string | null }) => void;
};

const previewWidth = 420;
const previewHeight = 260;
const previewPadding = 24;

const overlayTypeOptions = [
  { value: "HUNTING_AREA", label: "Jaktområde" },
  { value: "FISHING_ZONE", label: "Fiskeområde" },
  { value: "EXCLUDED_ZONE", label: "Unntakssone" },
  { value: "ACCESS_ZONE", label: "Adkomstsone" },
  { value: "ENTRY_ZONE", label: "Parkering / innsteg" },
];

const overlayVisibilityOptions = [
  { value: "PRIVATE_DRAFT", label: "Kun privat utkast" },
  { value: "INTERNAL_REVIEW", label: "Kun intern gjennomgang" },
  { value: "PUBLIC_SIMPLIFIED", label: "Offentlig forenklet lag" },
  { value: "BOOKER_ONLY_DETAILED", label: "Detaljert kun for bookere" },
];

const overlayConfidenceOptions = [
  { value: "LOW", label: "Lav tillit" },
  { value: "MEDIUM", label: "Middels tillit" },
  { value: "HIGH", label: "Høy tillit" },
];

const initialForm = {
  id: "",
  title: "",
  description: "",
  overlayType: "HUNTING_AREA",
  visibility: "PRIVATE_DRAFT",
  provenance: "MANUAL",
  confidence: "MEDIUM",
};

function toDraftPoints(points: Array<{ lat: number; lng: number }>) {
  return points.map((point) => ({
    lat: point.lat.toFixed(6),
    lng: point.lng.toFixed(6),
  }));
}

export function RightsOverlayEditor({
  propertyId,
  propertyBoundaryPoints,
  overlays,
  onOverlaysChange,
  onStatus,
}: RightsOverlayEditorProps) {
  const [form, setForm] = useState(initialForm);
  const [polygonDrafts, setPolygonDrafts] = useState<OverlayPoint[][]>([[]]);
  const [currentPolygonIndex, setCurrentPolygonIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const currentPolygon = useMemo(
    () => polygonDrafts[currentPolygonIndex] ?? [],
    [currentPolygonIndex, polygonDrafts],
  );
  const parsedPoints = useMemo(
    () =>
      currentPolygon
        .map((point, index) => ({
          index,
          lat: Number(point.lat),
          lng: Number(point.lng),
        }))
        .filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng)),
    [currentPolygon],
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

    return {
      minLat,
      minLng,
      latSpan,
      lngSpan,
      innerWidth: previewWidth - previewPadding * 2,
      innerHeight: previewHeight - previewPadding * 2,
    };
  }, [parsedPoints]);

  const previewPoints = useMemo(() => {
    if (!previewModel) {
      return [];
    }

    return parsedPoints.map((point) => ({
      ...point,
      x:
        previewPadding +
        ((point.lng - previewModel.minLng) / previewModel.lngSpan) * previewModel.innerWidth,
      y:
        previewHeight -
        previewPadding -
        ((point.lat - previewModel.minLat) / previewModel.latSpan) * previewModel.innerHeight,
    }));
  }, [parsedPoints, previewModel]);

  function resetDraft() {
    setForm(initialForm);
    setPolygonDrafts([[]]);
    setCurrentPolygonIndex(0);
    setDraggingIndex(null);
  }

  async function refreshOverlays() {
    const response = await fetch(`/api/properties/${propertyId}/rights-overlays`);
    const data = (await response.json()) as { overlays?: RightsOverlay[] };
    onOverlaysChange(data.overlays ?? []);
  }

  function loadOverlay(overlay: RightsOverlay) {
    setForm({
      id: overlay.id,
      title: overlay.title,
      description: overlay.description ?? "",
      overlayType: overlay.overlayType,
      visibility: overlay.visibility,
      provenance: overlay.provenance,
      confidence: overlay.confidence,
    });
    setPolygonDrafts(
      overlay.polygons.length > 0
        ? overlay.polygons.map((polygon) => toDraftPoints(polygon))
        : [[]],
    );
    setCurrentPolygonIndex(0);
  }

  function addPolygon() {
    const nextIndex = polygonDrafts.length;
    setPolygonDrafts((current) => [...current, [{ lat: "", lng: "" }]]);
    setCurrentPolygonIndex(nextIndex);
  }

  function cloneBoundaryAsPolygon() {
    if (propertyBoundaryPoints.length < 3) {
      onStatus({
        error: "Lagre eller importer eiendomsgrensen først før du bruker den som start for et eget lag.",
        success: null,
      });
      return;
    }

    setPolygonDrafts((current) => {
      const next = [...current];
      next[currentPolygonIndex] = toDraftPoints(propertyBoundaryPoints);
      return next;
    });
  }

  function updateCurrentPoint(index: number, key: keyof OverlayPoint, value: string) {
    setPolygonDrafts((current) =>
      current.map((polygon, polygonIndex) =>
        polygonIndex === currentPolygonIndex
          ? polygon.map((point, pointIndex) =>
              pointIndex === index ? { ...point, [key]: value } : point,
            )
          : polygon,
      ),
    );
  }

  function addPoint() {
    setPolygonDrafts((current) =>
      current.map((polygon, polygonIndex) =>
        polygonIndex === currentPolygonIndex ? [...polygon, { lat: "", lng: "" }] : polygon,
      ),
    );
  }

  function removePoint(index: number) {
    setPolygonDrafts((current) =>
      current.map((polygon, polygonIndex) =>
        polygonIndex === currentPolygonIndex
          ? polygon.filter((_, pointIndex) => pointIndex !== index)
          : polygon,
      ),
    );
  }

  function removePolygon(index: number) {
    setPolygonDrafts((current) => current.filter((_, polygonIndex) => polygonIndex !== index));
    setCurrentPolygonIndex((current) => Math.max(0, Math.min(current, polygonDrafts.length - 2)));
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

    updateCurrentPoint(index, "lat", lat.toFixed(6));
    updateCurrentPoint(index, "lng", lng.toFixed(6));
  }

  function handlePreviewPointerMove(event: PointerEvent<SVGSVGElement>) {
    if (draggingIndex === null) {
      return;
    }

    updatePointFromPreview(draggingIndex, event.clientX, event.clientY);
  }

  async function saveOverlay() {
    onStatus({ error: null, success: null });

    const polygons = polygonDrafts
      .map((polygon) =>
        polygon
          .map((point) => ({
            lat: Number(point.lat),
            lng: Number(point.lng),
          }))
          .filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng)),
      )
      .filter((polygon) => polygon.length >= 3);

    if (!form.title.trim()) {
      onStatus({ error: "Gi laget et navn før du lagrer det.", success: null });
      return;
    }

    if (polygons.length === 0) {
      onStatus({
        error: "Legg inn minst ett polygon med tre punkter før du lagrer laget.",
        success: null,
      });
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        overlayType: form.overlayType,
        visibility: form.visibility,
        provenance: form.provenance,
        confidence: form.confidence,
        polygons,
      };
      const target = form.id
        ? `/api/rights-overlays/${form.id}`
        : `/api/properties/${propertyId}/rights-overlays`;
      const method = form.id ? "PUT" : "POST";

      const response = await fetch(target, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Vi klarte ikke å lagre laget.");
      }

      await refreshOverlays();
      onStatus({
        error: null,
        success: form.id ? "Laget er oppdatert." : "Laget er opprettet.",
      });
      resetDraft();
    } catch (error) {
      onStatus({
        error: error instanceof Error ? error.message : "Vi klarte ikke å lagre laget.",
        success: null,
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteOverlay() {
    if (!form.id) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/rights-overlays/${form.id}`, {
        method: "DELETE",
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Vi klarte ikke å slette laget.");
      }

      await refreshOverlays();
      onStatus({ error: null, success: "Laget er slettet." });
      resetDraft();
    } catch (error) {
      onStatus({
        error: error instanceof Error ? error.message : "Vi klarte ikke å slette laget.",
        success: null,
      });
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <section className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
        Heyra-lag for jakt, fiske og adkomst
      </p>
      <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
        Rediger egne polygoner for det faktiske tilbudsområdet. Ett lag kan ha flere polygoner hvis terrenget er delt opp.
      </p>

      <div className="mt-5 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-3">
          {overlays.length > 0 ? (
            overlays.map((overlay) => (
              <button
                key={overlay.id}
                type="button"
                onClick={() => loadOverlay(overlay)}
                className={`block w-full rounded-2xl border px-4 py-3 text-left ${
                  form.id === overlay.id
                    ? "border-[var(--amber)] bg-[#fff8eb]"
                    : "border-[var(--border)] bg-white"
                }`}
              >
                <p className="font-semibold text-[var(--foreground)]">{overlay.title}</p>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {overlayTypeOptions.find((option) => option.value === overlay.overlayType)?.label ??
                    overlay.overlayType}
                  {" · "}
                  {overlay.polygons.length} polygon{overlay.polygons.length === 1 ? "" : "er"}
                </p>
              </button>
            ))
          ) : (
            <p className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--muted)]">
              Ingen egne jakt-, fiske- eller adkomstlag er lagret ennå.
            </p>
          )}
        </div>

        <div className="space-y-4 rounded-2xl border border-[var(--border)] bg-white p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              placeholder="Navn på lag"
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm sm:col-span-2"
            />
            <select
              value={form.overlayType}
              onChange={(event) =>
                setForm((current) => ({ ...current, overlayType: event.target.value }))
              }
              className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm"
            >
              {overlayTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={form.visibility}
              onChange={(event) =>
                setForm((current) => ({ ...current, visibility: event.target.value }))
              }
              className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm"
            >
              {overlayVisibilityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={form.confidence}
              onChange={(event) =>
                setForm((current) => ({ ...current, confidence: event.target.value }))
              }
              className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm"
            >
              {overlayConfidenceOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <textarea
              placeholder="Kort beskrivelse (valgfritt)"
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({ ...current, description: event.target.value }))
              }
              className="min-h-24 rounded-2xl border border-[var(--border)] px-4 py-3 text-sm sm:col-span-2"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {polygonDrafts.map((polygon, index) => (
              <button
                key={`polygon-${index}`}
                type="button"
                onClick={() => setCurrentPolygonIndex(index)}
                className={`rounded-full px-3 py-2 text-sm font-semibold ${
                  currentPolygonIndex === index
                    ? "bg-[var(--forest)] text-white"
                    : "border border-[var(--border)] bg-white text-[var(--foreground)]"
                }`}
              >
                Polygon {index + 1} ({polygon.filter((point) => point.lat && point.lng).length})
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={addPolygon}
              className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--foreground)]"
            >
              Legg til polygon
            </button>
            <button
              type="button"
              onClick={cloneBoundaryAsPolygon}
              className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--foreground)]"
            >
              Bruk eiendomsgrensen som start
            </button>
            {polygonDrafts.length > 1 ? (
              <button
                type="button"
                onClick={() => removePolygon(currentPolygonIndex)}
                className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--foreground)]"
              >
                Fjern valgt polygon
              </button>
            ) : null}
          </div>

          <div className="overflow-hidden rounded-[1.4rem] border border-[var(--border)] bg-[#f4f0e5]">
            <svg
              ref={svgRef}
              viewBox={`0 0 ${previewWidth} ${previewHeight}`}
              className="h-[260px] w-full touch-none"
              onPointerMove={handlePreviewPointerMove}
              onPointerUp={() => setDraggingIndex(null)}
              onPointerLeave={() => setDraggingIndex(null)}
            >
              <rect x="0" y="0" width={previewWidth} height={previewHeight} fill="#f4f0e5" />
              {previewPoints.length >= 3 ? (
                <polygon
                  points={previewPoints.map((point) => `${point.x},${point.y}`).join(" ")}
                  fill="rgba(34, 94, 60, 0.16)"
                  stroke="rgba(27,67,50,0.85)"
                  strokeWidth="2.5"
                />
              ) : null}
              {previewPoints.map((point) => (
                <g key={`preview-${point.index}`}>
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r="8"
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

          <div className="space-y-3">
            {currentPolygon.map((point, index) => (
              <div
                key={`overlay-point-${currentPolygonIndex}-${index}`}
                className="grid gap-3 rounded-2xl border border-[var(--border)] p-4 sm:grid-cols-[1fr_1fr_auto]"
              >
                <input
                  type="number"
                  step="0.000001"
                  value={point.lat}
                  onChange={(event) => updateCurrentPoint(index, "lat", event.target.value)}
                  placeholder={`Polygon ${currentPolygonIndex + 1} latitude`}
                  className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm"
                />
                <input
                  type="number"
                  step="0.000001"
                  value={point.lng}
                  onChange={(event) => updateCurrentPoint(index, "lng", event.target.value)}
                  placeholder={`Polygon ${currentPolygonIndex + 1} longitude`}
                  className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm"
                />
                <button
                  type="button"
                  onClick={() => removePoint(index)}
                  className="rounded-full border border-[var(--border)] px-4 py-3 text-sm text-[var(--muted)]"
                >
                  Fjern
                </button>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={addPoint}
              className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--foreground)]"
            >
              Legg til punkt i valgt polygon
            </button>
            <button
              type="button"
              onClick={saveOverlay}
              disabled={isSaving}
              className="rounded-full bg-[var(--forest)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {isSaving ? "Lagrer..." : form.id ? "Oppdater lag" : "Opprett lag"}
            </button>
            {form.id ? (
              <>
                <button
                  type="button"
                  onClick={resetDraft}
                  className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--foreground)]"
                >
                  Nytt lag
                </button>
                <button
                  type="button"
                  onClick={deleteOverlay}
                  disabled={isDeleting}
                  className="rounded-full border border-[#e7c8c0] px-4 py-2 text-sm font-semibold text-[#8c3b19] disabled:opacity-60"
                >
                  {isDeleting ? "Sletter..." : "Slett lag"}
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
