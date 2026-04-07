"use client";

import { useEffect, useMemo, useState } from "react";
import { getGeolocationErrorMessage, getGeolocationUnavailableMessage } from "@/lib/geolocation-client";

type LoggerMode = "hunting" | "fishing";

type LogEntryType =
  | "NOTE"
  | "SIGHTING"
  | "TRACK"
  | "SHOT"
  | "CATCH"
  | "WATER"
  | "ACCESS";

type LogEntry = {
  id: string;
  type: LogEntryType;
  note: string;
  createdAt: string;
  latitude: string | null;
  longitude: string | null;
};

type StoredDraft = {
  notes: string;
  latitude: string;
  longitude: string;
  capturedAt: string | null;
  photoName: string | null;
  photoPreview: string | null;
  entries: LogEntry[];
};

const emptyDraft: StoredDraft = {
  notes: "",
  latitude: "",
  longitude: "",
  capturedAt: null,
  photoName: null,
  photoPreview: null,
  entries: [],
};

const quickEntryTypes: Record<LoggerMode, Array<{ label: string; value: LogEntryType }>> = {
  hunting: [
    { label: "Sighting", value: "SIGHTING" },
    { label: "Track", value: "TRACK" },
    { label: "Shot", value: "SHOT" },
    { label: "Note", value: "NOTE" },
  ],
  fishing: [
    { label: "Catch", value: "CATCH" },
    { label: "Water", value: "WATER" },
    { label: "Access", value: "ACCESS" },
    { label: "Note", value: "NOTE" },
  ],
};

function formatEntryType(type: LogEntryType) {
  return type.toLowerCase().replace("_", " ");
}

export function FieldTripLogger({
  storageKey,
  mode,
  title,
}: {
  storageKey: string;
  mode: LoggerMode;
  title: string;
}) {
  const [draft, setDraft] = useState<StoredDraft>(emptyDraft);
  const [message, setMessage] = useState<string | null>(null);
  const [isCapturingLocation, setIsCapturingLocation] = useState(false);
  const [entryType, setEntryType] = useState<LogEntryType>(
    mode === "hunting" ? "SIGHTING" : "CATCH",
  );

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);

    if (!saved) {
      return;
    }

    try {
      const parsed = JSON.parse(saved) as StoredDraft;
      setDraft({
        ...emptyDraft,
        ...parsed,
      });
    } catch {
      return;
    }
  }, [storageKey]);

  const hasContent = useMemo(
    () =>
      Boolean(
        draft.notes.trim() ||
          draft.latitude ||
          draft.longitude ||
          draft.photoPreview ||
          draft.photoName ||
          draft.entries.length,
      ),
    [draft],
  );

  function persist(next: StoredDraft, successMessage?: string) {
    setDraft(next);
    window.localStorage.setItem(storageKey, JSON.stringify(next));

    if (successMessage) {
      setMessage(successMessage);
      window.setTimeout(() => setMessage(null), 2200);
    }
  }

  async function captureLocation() {
    const unavailableMessage = getGeolocationUnavailableMessage();
    if (unavailableMessage) {
      setMessage(unavailableMessage);
      return;
    }

    setIsCapturingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsCapturingLocation(false);
        persist(
          {
            ...draft,
            latitude: position.coords.latitude.toFixed(6),
            longitude: position.coords.longitude.toFixed(6),
            capturedAt: new Date().toISOString(),
          },
          "Location saved to the field log.",
        );
      },
      () => {
        setIsCapturingLocation(false);
        setMessage(getGeolocationErrorMessage());
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
      },
    );
  }

  function clearDraft() {
    window.localStorage.removeItem(storageKey);
    setDraft(emptyDraft);
    setMessage("Field log cleared on this device.");
  }

  function saveEntry(type: LogEntryType) {
    if (!draft.notes.trim()) {
      setMessage("Add a short note before saving it to the log.");
      return;
    }

    persist(
      {
        ...draft,
        notes: "",
        entries: [
          {
            id: `${Date.now()}`,
            type,
            note: draft.notes.trim(),
            createdAt: new Date().toISOString(),
            latitude: draft.latitude || null,
            longitude: draft.longitude || null,
          },
          ...draft.entries,
        ],
      },
      "Log entry saved on this device.",
    );
  }

  function removeEntry(entryId: string) {
    persist(
      {
        ...draft,
        entries: draft.entries.filter((entry) => entry.id !== entryId),
      },
      "Log entry removed.",
    );
  }

  function exportLog() {
    if (!draft.entries.length && !draft.notes.trim()) {
      setMessage("There is nothing to export yet.");
      return;
    }

    const lines = [
      `${title}`,
      `Mode: ${mode}`,
      `Exported: ${new Date().toLocaleString("nb-NO")}`,
      "",
      ...draft.entries.map((entry) =>
        [
          `${new Date(entry.createdAt).toLocaleString("nb-NO")} · ${formatEntryType(entry.type)}`,
          entry.note,
          entry.latitude && entry.longitude ? `Position: ${entry.latitude}, ${entry.longitude}` : null,
          "",
        ]
          .filter(Boolean)
          .join("\n"),
      ),
      ...(draft.notes.trim()
        ? ["Unsaved draft note:", draft.notes.trim(), ""]
        : []),
    ].join("\n");

    const blob = new Blob([lines], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${storageKey.replace(/[^a-z0-9-]+/gi, "-")}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage("Field log exported as a text file.");
  }

  function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      persist(
        {
          ...draft,
          photoName: file.name,
          photoPreview: typeof reader.result === "string" ? reader.result : null,
        },
        "Photo saved to the offline field log.",
      );
    };
    reader.readAsDataURL(file);
  }

  return (
    <article className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
        {mode === "hunting" ? "Jaktlogg" : "Field log"}
      </p>
      <h2 className="mt-3 text-2xl text-[var(--forest)]">{title}</h2>
      <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
        This draft stays on the device so you can keep notes offline, capture a position, and attach a camera photo while you are in the field.
      </p>

      <div className="mt-4 space-y-4">
        <label className="block space-y-2 text-sm font-semibold text-[var(--foreground)]">
          {mode === "hunting" ? "Trip or harvest notes" : "Water, conditions, or catch notes"}
          <textarea
            value={draft.notes}
            onChange={(event) =>
              persist({
                ...draft,
                notes: event.target.value,
              })
            }
            rows={5}
            className="w-full rounded-[1.2rem] border border-[var(--border)] bg-white px-4 py-3 font-normal outline-none"
            placeholder={
              mode === "hunting"
                ? "Tracks, weather, sightings, harvest details, or practical reminders."
                : "Water level, fish activity, best pool, access reminders, or local conditions."
            }
          />
        </label>

        <div className="flex flex-wrap gap-2">
          {quickEntryTypes[mode].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                setEntryType(option.value);
                saveEntry(option.value);
              }}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                entryType === option.value
                  ? "bg-[var(--forest)] text-white"
                  : "border border-[var(--border)] text-[var(--foreground)]"
              }`}
            >
              Save as {option.label.toLowerCase()}
            </button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-[1.2rem] border border-[var(--border)] bg-[#fbf8f1] p-4 text-sm leading-7 text-[var(--foreground)]">
            <p className="font-semibold">Saved position</p>
            <p className="mt-2 text-[var(--muted)]">
              {draft.latitude && draft.longitude
                ? `${draft.latitude}, ${draft.longitude}`
                : "No location saved yet."}
            </p>
            {draft.capturedAt ? (
              <p className="text-[var(--muted)]">
                Captured {new Date(draft.capturedAt).toLocaleString("nb-NO")}
              </p>
            ) : null}
            <button
              type="button"
              onClick={() => void captureLocation()}
              disabled={isCapturingLocation}
              className="mt-3 rounded-full bg-[var(--forest)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
            >
              {isCapturingLocation ? "Capturing..." : "Save current position"}
            </button>
          </div>

          <div className="rounded-[1.2rem] border border-[var(--border)] bg-[#fbf8f1] p-4 text-sm leading-7 text-[var(--foreground)]">
            <p className="font-semibold">Camera capture</p>
            <p className="mt-2 text-[var(--muted)]">
              {draft.photoName ? `Saved photo: ${draft.photoName}` : "No field photo saved yet."}
            </p>
            <label className="mt-3 inline-flex cursor-pointer rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--foreground)]">
              Capture photo
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handlePhotoChange}
              />
            </label>
          </div>
        </div>

        {draft.photoPreview ? (
          <div className="overflow-hidden rounded-[1.2rem] border border-[var(--border)] bg-[#f6f3ec]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={draft.photoPreview}
              alt={draft.photoName ?? "Field capture"}
              className="h-64 w-full object-cover"
            />
          </div>
        ) : null}

        {draft.entries.length > 0 ? (
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
              Saved timeline
            </p>
            {draft.entries.map((entry) => (
              <div
                key={entry.id}
                className="rounded-[1.2rem] border border-[var(--border)] bg-[#fbf8f1] p-4 text-sm leading-7 text-[var(--foreground)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold capitalize">{formatEntryType(entry.type)}</p>
                    <p className="text-[var(--muted)]">
                      {new Date(entry.createdAt).toLocaleString("nb-NO")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeEntry(entry.id)}
                    className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]"
                  >
                    Remove
                  </button>
                </div>
                <p className="mt-2">{entry.note}</p>
                {entry.latitude && entry.longitude ? (
                  <p className="mt-2 text-[var(--muted)]">
                    Position: {entry.latitude}, {entry.longitude}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={exportLog}
          disabled={!hasContent}
          className="rounded-full bg-[var(--forest)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          Export field log
        </button>
        <button
          type="button"
          onClick={clearDraft}
          disabled={!hasContent}
          className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] disabled:opacity-50"
        >
          Clear local draft
        </button>
      </div>
      {message ? <p className="mt-3 text-sm text-[var(--muted)]">{message}</p> : null}
    </article>
  );
}
