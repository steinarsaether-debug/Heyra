"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ServiceProviderProfileInput } from "@/lib/service-schema";

type ServiceProviderProfileRecord = ServiceProviderProfileInput & {
  id?: string;
};

const emptyProfile: ServiceProviderProfileInput = {
  businessName: "",
  publicContactName: "",
  phone: "",
  email: "",
  website: "",
  municipality: "",
  county: "",
  latitude: null,
  longitude: null,
  yearsExperience: null,
  description: "",
  qualifications: {
    licenseSummary: "",
    equipmentSummary: "",
    transportCoverage: "",
    accommodationDetails: "",
  },
};

export function ServiceProviderProfileForm({
  initialProfile,
}: {
  initialProfile?: ServiceProviderProfileRecord | null;
}) {
  const router = useRouter();
  const [form, setForm] = useState<ServiceProviderProfileInput>(initialProfile ?? emptyProfile);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    setMessage(null);

    const response = await fetch("/api/service-provider/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    const data = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(data.error ?? "Kunne ikke lagre leverandørprofilen.");
      setIsSaving(false);
      return;
    }

    setMessage("Leverandørprofilen er lagret.");
    setIsSaving(false);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--amber)]">
          Leverandøroppsett
        </p>
        <h2 className="mt-3 text-2xl text-[var(--forest)]">Sett opp den offentlige leverandørprofilen din.</h2>
        <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
          Denne profilen ligger bak hver tjeneste du publiserer, så hold den praktisk, tydelig og lett å stole på.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm font-semibold text-[var(--foreground)]">
          Firmanavn eller leverandørnavn
          <input
            value={form.businessName}
            onChange={(event) => setForm((current) => ({ ...current, businessName: event.target.value }))}
            className="w-full rounded-[1rem] border border-[var(--border)] bg-white px-4 py-3 font-normal outline-none"
          />
        </label>
        <label className="space-y-2 text-sm font-semibold text-[var(--foreground)]">
          Offentlig kontaktperson
          <input
            value={form.publicContactName}
            onChange={(event) => setForm((current) => ({ ...current, publicContactName: event.target.value }))}
            className="w-full rounded-[1rem] border border-[var(--border)] bg-white px-4 py-3 font-normal outline-none"
          />
        </label>
        <label className="space-y-2 text-sm font-semibold text-[var(--foreground)]">
          Telefon
          <input
            value={form.phone}
            onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
            className="w-full rounded-[1rem] border border-[var(--border)] bg-white px-4 py-3 font-normal outline-none"
          />
        </label>
        <label className="space-y-2 text-sm font-semibold text-[var(--foreground)]">
          Offentlig e-post
          <input
            type="email"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            className="w-full rounded-[1rem] border border-[var(--border)] bg-white px-4 py-3 font-normal outline-none"
          />
        </label>
        <label className="space-y-2 text-sm font-semibold text-[var(--foreground)] md:col-span-2">
          Nettside
          <input
            value={form.website}
            onChange={(event) => setForm((current) => ({ ...current, website: event.target.value }))}
            className="w-full rounded-[1rem] border border-[var(--border)] bg-white px-4 py-3 font-normal outline-none"
          />
        </label>
        <label className="space-y-2 text-sm font-semibold text-[var(--foreground)]">
          Kommune
          <input
            value={form.municipality}
            onChange={(event) => setForm((current) => ({ ...current, municipality: event.target.value }))}
            className="w-full rounded-[1rem] border border-[var(--border)] bg-white px-4 py-3 font-normal outline-none"
          />
        </label>
        <label className="space-y-2 text-sm font-semibold text-[var(--foreground)]">
          Fylke
          <input
            value={form.county}
            onChange={(event) => setForm((current) => ({ ...current, county: event.target.value }))}
            className="w-full rounded-[1rem] border border-[var(--border)] bg-white px-4 py-3 font-normal outline-none"
          />
        </label>
        <label className="space-y-2 text-sm font-semibold text-[var(--foreground)]">
          Breddegrad
          <input
            type="number"
            step="0.000001"
            value={form.latitude ?? ""}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                latitude: event.target.value === "" ? null : Number(event.target.value),
              }))
            }
            className="w-full rounded-[1rem] border border-[var(--border)] bg-white px-4 py-3 font-normal outline-none"
          />
        </label>
        <label className="space-y-2 text-sm font-semibold text-[var(--foreground)]">
          Lengdegrad
          <input
            type="number"
            step="0.000001"
            value={form.longitude ?? ""}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                longitude: event.target.value === "" ? null : Number(event.target.value),
              }))
            }
            className="w-full rounded-[1rem] border border-[var(--border)] bg-white px-4 py-3 font-normal outline-none"
          />
        </label>
        <label className="space-y-2 text-sm font-semibold text-[var(--foreground)]">
          Antall år med erfaring
          <input
            type="number"
            min="0"
            value={form.yearsExperience ?? ""}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                yearsExperience: event.target.value === "" ? null : Number(event.target.value),
              }))
            }
            className="w-full rounded-[1rem] border border-[var(--border)] bg-white px-4 py-3 font-normal outline-none"
          />
        </label>
      </div>

      <label className="block space-y-2 text-sm font-semibold text-[var(--foreground)]">
        Offentlig beskrivelse
        <textarea
          rows={5}
          value={form.description}
          onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
          className="w-full rounded-[1rem] border border-[var(--border)] bg-white px-4 py-3 font-normal outline-none"
        />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm font-semibold text-[var(--foreground)]">
          Lisenser og godkjenninger
          <textarea
            rows={4}
            value={form.qualifications.licenseSummary}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                qualifications: { ...current.qualifications, licenseSummary: event.target.value },
              }))
            }
            className="w-full rounded-[1rem] border border-[var(--border)] bg-white px-4 py-3 font-normal outline-none"
          />
        </label>
        <label className="space-y-2 text-sm font-semibold text-[var(--foreground)]">
          Utstyr og praktisk opplegg
          <textarea
            rows={4}
            value={form.qualifications.equipmentSummary}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                qualifications: { ...current.qualifications, equipmentSummary: event.target.value },
              }))
            }
            className="w-full rounded-[1rem] border border-[var(--border)] bg-white px-4 py-3 font-normal outline-none"
          />
        </label>
        <label className="space-y-2 text-sm font-semibold text-[var(--foreground)]">
          Transportdekning
          <textarea
            rows={4}
            value={form.qualifications.transportCoverage}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                qualifications: { ...current.qualifications, transportCoverage: event.target.value },
              }))
            }
            className="w-full rounded-[1rem] border border-[var(--border)] bg-white px-4 py-3 font-normal outline-none"
          />
        </label>
        <label className="space-y-2 text-sm font-semibold text-[var(--foreground)]">
          Overnattingsdetaljer
          <textarea
            rows={4}
            value={form.qualifications.accommodationDetails}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                qualifications: { ...current.qualifications, accommodationDetails: event.target.value },
              }))
            }
            className="w-full rounded-[1rem] border border-[var(--border)] bg-white px-4 py-3 font-normal outline-none"
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-full bg-[var(--forest)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-70"
        >
          {isSaving ? "Lagrer..." : "Lagre leverandørprofil"}
        </button>
        {message ? <p className="text-sm text-[var(--forest)]">{message}</p> : null}
        {error ? <p className="text-sm text-[#7f3127]">{error}</p> : null}
      </div>
    </form>
  );
}
