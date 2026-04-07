"use client";

import { ServiceCategory, ServiceListingStatus } from "@prisma/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ServiceListingInput, ServiceProviderProfileInput } from "@/lib/service-schema";
import {
  formatServiceCategory,
  formatServiceStatus,
  getServiceChecklist,
} from "@/lib/service-view";
import { serviceCategoryOptions } from "@/lib/service-constants";

type ServiceRecord = ServiceListingInput & {
  id: string;
  slug: string;
  status: ServiceListingStatus;
  reviewerNotes: string | null;
};

const emptyService: ServiceListingInput = {
  category: ServiceCategory.DOG_HANDLER,
  title: "",
  description: "",
  municipality: "",
  county: "",
  latitude: null,
  longitude: null,
  priceFromNok: null,
  qualifications: {
    licenseSummary: "",
    equipmentSummary: "",
    transportCoverage: "",
    accommodationDetails: "",
  },
};

export function ServiceListingEditor({
  mode,
  providerProfile,
  initialService,
}: {
  mode: "create" | "edit";
  providerProfile: ServiceProviderProfileInput;
  initialService?: ServiceRecord | null;
}) {
  const router = useRouter();
  const [form, setForm] = useState<ServiceListingInput>(
    initialService ?? {
      ...emptyService,
      municipality: providerProfile.municipality,
      county: providerProfile.county,
      qualifications: providerProfile.qualifications,
    },
  );
  const [status, setStatus] = useState<ServiceListingStatus>(
    initialService?.status ?? ServiceListingStatus.DRAFT,
  );
  const [reviewerNotes, setReviewerNotes] = useState(initialService?.reviewerNotes ?? "");
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const checklist = getServiceChecklist(
    {
      title: form.title,
      description: form.description,
      municipality: form.municipality,
      county: form.county,
      status,
    },
    providerProfile,
  );

  async function saveService() {
    const response = await fetch(mode === "create" ? "/api/services" : `/api/services/${initialService?.id}`, {
      method: mode === "create" ? "POST" : "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    const data = (await response.json()) as { error?: string; serviceId?: string };

    if (!response.ok) {
      throw new Error(data.error ?? "Unable to save the service.");
    }

    return mode === "create" ? data.serviceId ?? null : initialService?.id ?? null;
  }

  async function runAction(action: "save_draft" | "submit_for_review") {
    setIsWorking(true);
    setError(null);

    try {
      const serviceId = await saveService();

      if (!serviceId) {
        throw new Error("Unable to identify the saved service.");
      }

      const response = await fetch(`/api/services/${serviceId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });

      const data = (await response.json()) as { error?: string; service?: { status: ServiceListingStatus } };

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to update service status.");
      }

      setStatus(data.service?.status ?? (action === "submit_for_review" ? ServiceListingStatus.PENDING_REVIEW : ServiceListingStatus.DRAFT));

      if (mode === "create") {
        router.push("/dashboard/services");
        return;
      }

      router.refresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to save the service.");
    } finally {
      setIsWorking(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--amber)]">
              Service editor
            </p>
            <h1 className="mt-3 text-3xl text-[var(--forest)]">
              {mode === "create" ? "Add a service" : form.title || "Edit service"}
            </h1>
            <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
              Make the service practical, trustworthy, and easy to contact from a listing context.
            </p>
          </div>
          <div className="rounded-[1.2rem] border border-[var(--border)] bg-[var(--sand)] px-4 py-3 text-sm text-[var(--foreground)]">
            Status: {formatServiceStatus(status)}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <form className="space-y-4 rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm font-semibold text-[var(--foreground)]">
              Category
              <select
                value={form.category}
                onChange={(event) =>
                  setForm((current) => ({ ...current, category: event.target.value as ServiceCategory }))
                }
                className="w-full rounded-[1rem] border border-[var(--border)] bg-white px-4 py-3 font-normal outline-none"
              >
                {serviceCategoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {formatServiceCategory(category)}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-sm font-semibold text-[var(--foreground)]">
              Public title
              <input
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                className="w-full rounded-[1rem] border border-[var(--border)] bg-white px-4 py-3 font-normal outline-none"
              />
            </label>
            <label className="space-y-2 text-sm font-semibold text-[var(--foreground)]">
              Municipality
              <input
                value={form.municipality}
                onChange={(event) => setForm((current) => ({ ...current, municipality: event.target.value }))}
                className="w-full rounded-[1rem] border border-[var(--border)] bg-white px-4 py-3 font-normal outline-none"
              />
            </label>
            <label className="space-y-2 text-sm font-semibold text-[var(--foreground)]">
              County
              <input
                value={form.county}
                onChange={(event) => setForm((current) => ({ ...current, county: event.target.value }))}
                className="w-full rounded-[1rem] border border-[var(--border)] bg-white px-4 py-3 font-normal outline-none"
              />
            </label>
            <label className="space-y-2 text-sm font-semibold text-[var(--foreground)]">
              Latitude
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
              Longitude
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
            <label className="space-y-2 text-sm font-semibold text-[var(--foreground)] md:col-span-2">
              Price from (NOK)
              <input
                type="number"
                min="0"
                value={form.priceFromNok ?? ""}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    priceFromNok: event.target.value === "" ? null : Number(event.target.value),
                  }))
                }
                className="w-full rounded-[1rem] border border-[var(--border)] bg-white px-4 py-3 font-normal outline-none"
              />
            </label>
          </div>

          <label className="block space-y-2 text-sm font-semibold text-[var(--foreground)]">
            Offentlig beskrivelse
            <textarea
              rows={6}
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

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => runAction("save_draft")}
              disabled={isWorking}
              className="rounded-full border border-[var(--border)] px-5 py-3 text-sm font-semibold text-[var(--foreground)] disabled:opacity-70"
            >
              {isWorking ? "Lagrer..." : "Lagre utkast"}
            </button>
            <button
              type="button"
              onClick={() => runAction("submit_for_review")}
              disabled={isWorking}
              className="rounded-full bg-[var(--forest)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-70"
            >
              Send til gjennomgang
            </button>
            <Link
              href="/dashboard/services"
              className="rounded-full px-5 py-3 text-sm font-semibold text-[var(--muted)]"
            >
              Tilbake til tjenester
            </Link>
          </div>

          {error ? <p className="text-sm text-[#7f3127]">{error}</p> : null}
        </form>

        <aside className="space-y-4">
          <article className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--amber)]">
              Klarhet for publisering
            </p>
            <p className="mt-3 text-4xl text-[var(--forest)]">{checklist.percent}%</p>
            <ul className="mt-4 space-y-2 text-sm leading-7 text-[var(--muted)]">
              {checklist.steps.map((step) => (
                <li key={step.key}>
                  {step.complete ? "Klar" : "Mangler fortsatt"}: {step.label}
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--amber)]">
              Offentlig leverandørkort
            </p>
            <h2 className="mt-3 text-2xl text-[var(--forest)]">{providerProfile.businessName}</h2>
            <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
              {providerProfile.municipality}, {providerProfile.county}
            </p>
            <p className="mt-4 text-sm leading-7 text-[var(--foreground)]">{providerProfile.description}</p>
            {reviewerNotes ? (
              <div className="mt-4 rounded-[1.2rem] border border-[var(--border)] bg-[var(--sand)] px-4 py-3 text-sm leading-7 text-[var(--foreground)]">
                <span className="font-semibold">Merknader fra gjennomgang:</span> {reviewerNotes}
              </div>
            ) : null}
          </article>
        </aside>
      </section>
    </div>
  );
}
