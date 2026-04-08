"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function PropertyIdentityEditor({
  propertyId,
  initialValues,
}: {
  propertyId: string;
  initialValues: {
    cadastralRef: string;
    municipality: string;
    county: string;
    areaHectares: number;
  };
}) {
  const router = useRouter();
  const [cadastralRef, setCadastralRef] = useState(initialValues.cadastralRef);
  const [municipality, setMunicipality] = useState(initialValues.municipality);
  const [county, setCounty] = useState(initialValues.county);
  const [areaHectares, setAreaHectares] = useState(String(initialValues.areaHectares));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSave() {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/properties/${propertyId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cadastralRef,
          municipality,
          county,
          areaHectares,
        }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to update the property.");
      }

      setSuccess(
        "Property identity updated. Boundary search and later listing steps will now use the corrected reference.",
      );
      router.refresh();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to update the property.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
        Correct property identity
      </p>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted)]">
        If the matrikkel reference or the basic location details were entered
        incorrectly during registration, you can correct them here without
        creating a new property draft.
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-semibold text-[var(--foreground)]">
            Matrikkelreferanse
          </span>
          <input
            value={cadastralRef}
            onChange={(event) => setCadastralRef(event.target.value)}
            className="w-full rounded-[1rem] border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--amber)]"
            placeholder="For example 4207-97/2"
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold text-[var(--foreground)]">
            Kommune
          </span>
          <input
            value={municipality}
            onChange={(event) => setMunicipality(event.target.value)}
            className="w-full rounded-[1rem] border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--amber)]"
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold text-[var(--foreground)]">
            Fylke
          </span>
          <input
            value={county}
            onChange={(event) => setCounty(event.target.value)}
            className="w-full rounded-[1rem] border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--amber)]"
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold text-[var(--foreground)]">
            Areal i hektar
          </span>
          <input
            type="number"
            min="0"
            step="0.1"
            value={areaHectares}
            onChange={(event) => setAreaHectares(event.target.value)}
            className="w-full rounded-[1rem] border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--amber)]"
          />
        </label>
      </div>

      {(error || success) ? (
        <div
          className={`mt-4 rounded-2xl px-4 py-3 text-sm ${
            error
              ? "border border-[#e7b0a7] bg-[#fff0ed] text-[#7f3127]"
              : "border border-[#b9d7c7] bg-[#eef8f1] text-[#1f5c3d]"
          }`}
        >
          {error ?? success}
        </div>
      ) : null}

      <div className="mt-5">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="rounded-full bg-[var(--forest)] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSaving ? "Saving..." : "Save corrections"}
        </button>
      </div>
    </section>
  );
}
