"use client";

import { PointerEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BoundaryMap } from "@/components/property/boundary-map";

type BoundaryEditorProps = {
  propertyId: string;
};

type BoundaryPoint = {
  lat: string;
  lng: string;
};

const initialPoints: BoundaryPoint[] = [
  { lat: "", lng: "" },
  { lat: "", lng: "" },
  { lat: "", lng: "" },
];

const previewWidth = 460;
const previewHeight = 320;
const previewPadding = 28;

export function BoundaryEditor({ propertyId }: BoundaryEditorProps) {
  const router = useRouter();
  const [points, setPoints] = useState<BoundaryPoint[]>(initialPoints);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingExisting, setIsLoadingExisting] = useState(true);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
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

    async function loadExistingBoundary() {
      try {
        const response = await fetch(`/api/properties/${propertyId}/boundary`);
        const data = (await response.json()) as {
          error?: string;
          points?: Array<{ lat: number; lng: number }>;
        };

        if (!response.ok) {
          if (!cancelled) {
            setError(data.error || "We could not load the existing boundary.");
          }
          return;
        }

        if (!cancelled && data.points && data.points.length >= 3) {
          setPoints(data.points.map((point) => ({ lat: String(point.lat), lng: String(point.lng) })));
        }
      } catch {
        if (!cancelled) {
          setError("We could not load the existing boundary.");
        }
      } finally {
        if (!cancelled) {
          setIsLoadingExisting(false);
        }
      }
    }

    loadExistingBoundary();

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

    const response = await fetch(`/api/properties/${propertyId}/boundary`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ points }),
    });

    const data = (await response.json()) as { error?: string };
    setIsSubmitting(false);

    if (!response.ok) {
      setError(data.error || "We could not save the boundary.");
      return;
    }

    setSuccess("Boundary saved.");
    router.push(`/dashboard/properties/${propertyId}`);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <section className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
          Map editor
        </p>
        <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
          Click on the map to add boundary points. Drag the numbered points to adjust them. If this feels awkward, you can ignore the map and use the coordinate fields below instead.
        </p>

        <div className="mt-5">
          <BoundaryMap
            points={parsedPoints.map((point) => ({ lat: point.lat, lng: point.lng }))}
            onAddPoint={addPointFromMap}
            onMovePoint={movePointFromMap}
          />
        </div>
      </section>

      <section className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
          Visual boundary board
        </p>
        <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
          Use this preview to understand the shape as you type. When you already have points entered, you can drag the numbered markers to fine-tune them. The coordinate fields remain the primary fallback input.
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

        <div className="mt-4 flex flex-wrap gap-3 text-sm text-[var(--muted)]">
          <div className="rounded-full border border-[var(--border)] bg-white px-4 py-2">
            {isLoadingExisting ? "Loading existing boundary..." : "Boundary board ready"}
          </div>
          <div className="rounded-full border border-[var(--border)] bg-white px-4 py-2">
            Drag markers to adjust saved or typed points
          </div>
          <div className="rounded-full border border-[var(--border)] bg-white px-4 py-2">
            Click the map to add points visually
          </div>
        </div>
      </section>

      <section className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
          Boundary points
        </p>
        <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
          Enter the corner points in order around the property edge. Use latitude and longitude from a GPS app, map reference, or survey notes. You do not need to repeat the first point; the system closes the shape for you.
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
          Before you save
        </p>
        <ul className="mt-4 space-y-3 text-sm leading-7 text-[var(--foreground)]">
          <li className="rounded-2xl border border-[var(--border)] px-4 py-3">
            Move around the boundary in one direction only, clockwise or counterclockwise.
          </li>
          <li className="rounded-2xl border border-[var(--border)] px-4 py-3">
            Keep the points to the outer edge of the area you want to offer.
          </li>
          <li className="rounded-2xl border border-[var(--border)] px-4 py-3">
            Start simple. You can refine the shape later if needed.
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
        {isSubmitting ? "Saving boundary..." : "Save boundary"}
      </button>
    </div>
  );
}
