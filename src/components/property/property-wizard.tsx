"use client";

import { ConfidenceLevel, SharedApprovalStatus, TerrainType, ValdVerificationMethod } from "@prisma/client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  formatConfidenceLevel,
  formatSharedApprovalStatus,
  formatTerrainTypes,
  formatValdVerificationMethod,
} from "@/lib/property-view";

type StepKey = "identity" | "property" | "terrain" | "review";

type WizardState = {
  cadastralRef: string;
  municipality: string;
  county: string;
  areaHectares: string;
  terrainTypes: TerrainType[];
  hasCabins: boolean;
  hasBoats: boolean;
  hasHides: boolean;
  hasButcheringFacility: boolean;
  valdName: string;
  valdRepresentativeName: string;
  valdRepresentativePhone: string;
  valdRepresentativeEmail: string;
  valdBestandsplanName: string;
  valdLocalReference: string;
  valdAuthorityContactName: string;
  valdAuthorityContactPhone: string;
  valdAuthorityContactEmail: string;
  valdVerificationMethod: ValdVerificationMethod;
  valdDataConfidence: ConfidenceLevel;
  representativeConfirmationStatus: SharedApprovalStatus;
  valdCoApprovalRequired: boolean;
  valdNotes: string;
  geometryConfidence: ConfidenceLevel;
  rightsConfidence: ConfidenceLevel;
  governanceConfidence: ConfidenceLevel;
  boundaryIsApproximate: boolean;
  rightsDifferFromBoundary: boolean;
};

const steps: Array<{ key: StepKey; title: string; hint: string }> = [
  {
    key: "identity",
    title: "Eiendomsidentitet",
    hint: "Vi starter med den grunnleggende eiendomsreferansen mange grunneiere allerede kjenner eller finner i offentlige registre.",
  },
  {
    key: "property",
    title: "Plassering og størrelse",
    hint: "Hold dette steget enkelt og praktisk. Vi spør bare om det som trengs for å lage et utkast.",
  },
  {
    key: "terrain",
    title: "Terreng og fasiliteter",
    hint: "Dette hjelper oss å forme en fremtidig annonse uten å spørre om alt på én gang.",
  },
  {
    key: "review",
    title: "Gå gjennom og lagre",
    hint: "Du kan lagre et utkast nå og legge inn kartgrenser senere.",
  },
];

const terrainOptions: Array<{ value: TerrainType; label: string }> = [
  { value: TerrainType.FOREST, label: "Skog" },
  { value: TerrainType.MOUNTAIN, label: "Fjell" },
  { value: TerrainType.FJORD, label: "Fjord" },
  { value: TerrainType.WETLAND, label: "Våtmark" },
  { value: TerrainType.FARMLAND, label: "Jordbruksland" },
  { value: TerrainType.COASTAL, label: "Kystterreng" },
];

const helpLinks = [
  {
    title: "Finn matrikkelopplysninger",
    href: "https://www.kartverket.no/eiendom",
    description: "Kartverkets eiendomssider peker videre til offisielle opplysninger om grunn og eierskap.",
  },
  {
    title: "Gjør skjema enklere å forstå",
    href: "https://aksel.nav.no/god-praksis/artikler/obligatoriske-og-valgfrie-skjemafelter",
    description: "Aksel anbefaler tydelige etiketter, færre valgfrie felt og klar merking av hva som er påkrevd.",
  },
  {
    title: "Tilgjengelighetsgrunnlag",
    href: "https://www.uutilsynet.no/wcag-standarden/oppbygging-av-wcag-21/139",
    description: "Uu-tilsynet beskriver tilgjengelig innhold som mulig å oppfatte, bruke, forstå og stole på.",
  },
];

const confidenceOptions: Array<{ value: ConfidenceLevel; label: string }> = [
  { value: ConfidenceLevel.LOW, label: "Lav tillit" },
  { value: ConfidenceLevel.MEDIUM, label: "Middels tillit" },
  { value: ConfidenceLevel.HIGH, label: "Høy tillit" },
];

const verificationOptions: Array<{ value: ValdVerificationMethod; label: string }> = [
  { value: ValdVerificationMethod.SELF_DECLARED, label: "Egenerklært av grunneier" },
  { value: ValdVerificationMethod.MUNICIPAL_REFERENCE, label: "Basert på kommunal referanse" },
  { value: ValdVerificationMethod.MANUAL_REVIEW, label: "Manuelt gjennomgått fra dokumenter eller kontakt" },
  { value: ValdVerificationMethod.EXTERNAL_REGISTRY, label: "Sjekket mot register eller myndighetsdata" },
];

const representativeConfirmationOptions: Array<{ value: SharedApprovalStatus; label: string }> = [
  { value: SharedApprovalStatus.NOT_REQUESTED, label: "Ikke forespurt ennå" },
  { value: SharedApprovalStatus.PENDING, label: "Forespurt og avventer" },
  { value: SharedApprovalStatus.CONFIRMED, label: "Bekreftet" },
];

const initialState: WizardState = {
  cadastralRef: "",
  municipality: "",
  county: "",
  areaHectares: "",
  terrainTypes: [],
  hasCabins: false,
  hasBoats: false,
  hasHides: false,
  hasButcheringFacility: false,
  valdName: "",
  valdRepresentativeName: "",
  valdRepresentativePhone: "",
  valdRepresentativeEmail: "",
  valdBestandsplanName: "",
  valdLocalReference: "",
  valdAuthorityContactName: "",
  valdAuthorityContactPhone: "",
  valdAuthorityContactEmail: "",
  valdVerificationMethod: ValdVerificationMethod.SELF_DECLARED,
  valdDataConfidence: ConfidenceLevel.LOW,
  representativeConfirmationStatus: SharedApprovalStatus.NOT_REQUESTED,
  valdCoApprovalRequired: true,
  valdNotes: "",
  geometryConfidence: ConfidenceLevel.LOW,
  rightsConfidence: ConfidenceLevel.LOW,
  governanceConfidence: ConfidenceLevel.LOW,
  boundaryIsApproximate: false,
  rightsDifferFromBoundary: false,
};

export function PropertyWizard() {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [values, setValues] = useState<WizardState>(initialState);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentStep = steps[stepIndex];
  const progress = useMemo(
    () => Math.round(((stepIndex + 1) / steps.length) * 100),
    [stepIndex],
  );

  function validateStep(index: number) {
    if (index === 0 && values.cadastralRef.trim().length < 3) {
      return "Please enter a cadastral number such as gnr/bnr.";
    }

    if (index === 1) {
      if (values.municipality.trim().length < 2) {
        return "Please enter the municipality.";
      }

      if (values.county.trim().length < 2) {
        return "Please enter the county.";
      }

      if (!values.areaHectares || Number(values.areaHectares) <= 0) {
        return "Please enter the approximate area in hectares.";
      }
    }

    if (index === 2 && values.terrainTypes.length === 0) {
      return "Please choose at least one terrain type.";
    }

    return null;
  }

  function goNext() {
    const validationError = validateStep(stepIndex);

    if (validationError) {
      setError(validationError);
      setSuccess(null);
      return;
    }

    setError(null);
    setStepIndex((index) => Math.min(index + 1, steps.length - 1));
  }

  function goBack() {
    setError(null);
    setStepIndex((index) => Math.max(index - 1, 0));
  }

  async function handleSaveDraft() {
    const validationError = validateStep(0) || validateStep(1) || validateStep(2);

    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    const response = await fetch("/api/properties", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cadastralRef: values.cadastralRef,
        municipality: values.municipality,
        county: values.county,
        areaHectares: values.areaHectares,
        terrainTypes: values.terrainTypes,
        hasCabins: values.hasCabins,
        hasBoats: values.hasBoats,
        hasHides: values.hasHides,
        hasButcheringFacility: values.hasButcheringFacility,
        valdName: values.valdName,
        valdRepresentativeName: values.valdRepresentativeName,
        valdRepresentativePhone: values.valdRepresentativePhone,
        valdRepresentativeEmail: values.valdRepresentativeEmail,
        valdBestandsplanName: values.valdBestandsplanName,
        valdLocalReference: values.valdLocalReference,
        valdAuthorityContactName: values.valdAuthorityContactName,
        valdAuthorityContactPhone: values.valdAuthorityContactPhone,
        valdAuthorityContactEmail: values.valdAuthorityContactEmail,
        valdVerificationMethod: values.valdVerificationMethod,
        valdDataConfidence: values.valdDataConfidence,
        representativeConfirmationStatus: values.representativeConfirmationStatus,
        valdCoApprovalRequired: values.valdCoApprovalRequired,
        valdNotes: values.valdNotes,
        geometryConfidence: values.geometryConfidence,
        rightsConfidence: values.rightsConfidence,
        governanceConfidence: values.governanceConfidence,
        boundaryIsApproximate: values.boundaryIsApproximate,
        rightsDifferFromBoundary: values.rightsDifferFromBoundary,
      }),
    });

    const data = (await response.json()) as { error?: string; propertyId?: string };
    setIsSubmitting(false);

    if (!response.ok) {
      setError(data.error || "We could not save the draft property.");
      return;
    }

    setSuccess("Draft property saved. You can add boundaries and listing details next.");
    router.push(`/dashboard/properties/${data.propertyId}`);
    router.refresh();
  }

  function toggleTerrainType(type: TerrainType) {
    setValues((current) => ({
      ...current,
      terrainTypes: current.terrainTypes.includes(type)
        ? current.terrainTypes.filter((item) => item !== type)
        : [...current.terrainTypes, type],
    }));
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <section className="space-y-5 rounded-[1.8rem] border border-[var(--border)] bg-white/80 p-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--amber)]">
            Step {stepIndex + 1} of {steps.length}
          </p>
          <h2 className="mt-3 text-3xl text-[var(--forest)]">{currentStep.title}</h2>
          <p className="mt-3 max-w-2xl text-base leading-8 text-[var(--muted)]">
            {currentStep.hint}
          </p>
          <p className="mt-3 text-sm text-[var(--muted)]">
            All fields shown in this step should be filled in before you continue.
          </p>
        </div>

        <div className="h-3 rounded-full bg-[#e7e1d5]">
          <div
            className="h-3 rounded-full bg-[var(--amber)] transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        {currentStep.key === "identity" ? (
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[var(--foreground)]" htmlFor="cadastralRef">
                Cadastral number (must be filled out)
              </label>
              <input
                id="cadastralRef"
                value={values.cadastralRef}
                onChange={(event) =>
                  setValues((current) => ({ ...current, cadastralRef: event.target.value }))
                }
                placeholder="Example: 0301-123/456"
                aria-required="true"
                className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-base outline-none transition focus:border-[var(--amber)]"
              />
              <p className="text-sm leading-6 text-[var(--muted)]">
                If you are unsure, Kartverket’s property services can help you locate the official gnr/bnr reference.
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[var(--foreground)]" htmlFor="valdName">
                Vald or shared hunting area name
              </label>
              <input
                id="valdName"
                value={values.valdName}
                onChange={(event) =>
                  setValues((current) => ({ ...current, valdName: event.target.value }))
                }
                placeholder="Leave blank if this property is managed on its own"
                className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-base outline-none transition focus:border-[var(--amber)]"
              />
              <p className="text-sm leading-6 text-[var(--muted)]">
                Add vald context if this property is part of a shared big-game area rather than an independently managed parcel.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[var(--foreground)]" htmlFor="geometryConfidence">
                  Map confidence
                </label>
                <select
                  id="geometryConfidence"
                  value={values.geometryConfidence}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      geometryConfidence: event.target.value as ConfidenceLevel,
                    }))
                  }
                  className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-base outline-none transition focus:border-[var(--amber)]"
                >
                  {confidenceOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[var(--foreground)]" htmlFor="rightsConfidence">
                  Rights confidence
                </label>
                <select
                  id="rightsConfidence"
                  value={values.rightsConfidence}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      rightsConfidence: event.target.value as ConfidenceLevel,
                    }))
                  }
                  className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-base outline-none transition focus:border-[var(--amber)]"
                >
                  {confidenceOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid gap-3">
              <label className="flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-white px-4 py-4 text-sm text-[var(--foreground)]">
                <input
                  type="checkbox"
                  checked={values.boundaryIsApproximate}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      boundaryIsApproximate: event.target.checked,
                    }))
                  }
                  className="mt-1"
                />
                <span>The boundary is approximate and may need correction after later review.</span>
              </label>
              <label className="flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-white px-4 py-4 text-sm text-[var(--foreground)]">
                <input
                  type="checkbox"
                  checked={values.rightsDifferFromBoundary}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      rightsDifferFromBoundary: event.target.checked,
                    }))
                  }
                  className="mt-1"
                />
                <span>The sellable hunting rights may differ from the mapped property area.</span>
              </label>
            </div>
          </div>
        ) : null}

        {currentStep.key === "property" ? (
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[var(--foreground)]" htmlFor="municipality">
                Municipality (must be filled out)
              </label>
              <input
                id="municipality"
                value={values.municipality}
                onChange={(event) =>
                  setValues((current) => ({ ...current, municipality: event.target.value }))
                }
                aria-required="true"
                className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-base outline-none transition focus:border-[var(--amber)]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-[var(--foreground)]" htmlFor="county">
                County (must be filled out)
              </label>
              <input
                id="county"
                value={values.county}
                onChange={(event) =>
                  setValues((current) => ({ ...current, county: event.target.value }))
                }
                aria-required="true"
                className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-base outline-none transition focus:border-[var(--amber)]"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-semibold text-[var(--foreground)]" htmlFor="areaHectares">
                Approximate area in hectares (must be filled out)
              </label>
              <input
                id="areaHectares"
                type="number"
                min="0"
                step="0.1"
                value={values.areaHectares}
                onChange={(event) =>
                  setValues((current) => ({ ...current, areaHectares: event.target.value }))
                }
                aria-required="true"
                className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-base outline-none transition focus:border-[var(--amber)]"
              />
            </div>
          </div>
        ) : null}

        {currentStep.key === "terrain" ? (
          <div className="space-y-6">
            <div>
              <p className="text-sm font-semibold text-[var(--foreground)]">
                Terrain type (choose at least one)
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {terrainOptions.map((option) => {
                  const selected = values.terrainTypes.includes(option.value);

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => toggleTerrainType(option.value)}
                      className={`rounded-2xl border px-4 py-4 text-left text-sm transition ${
                        selected
                          ? "border-[var(--amber)] bg-[#fff5e9] text-[var(--foreground)]"
                          : "border-[var(--border)] bg-white text-[var(--muted)]"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["hasCabins", "Cabins or accommodation"],
                ["hasBoats", "Boats or watercraft"],
                ["hasHides", "Hides or hunting stands"],
                ["hasButcheringFacility", "Butchering facility"],
              ].map(([key, label]) => (
                <label
                  key={key}
                  className="flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-white px-4 py-4 text-sm text-[var(--foreground)]"
                >
                  <input
                    type="checkbox"
                    checked={Boolean(values[key as keyof WizardState])}
                    onChange={(event) =>
                      setValues((current) => ({
                        ...current,
                        [key]: event.target.checked,
                      }))
                    }
                    className="mt-1"
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>

            {values.valdName.trim() ? (
              <div className="space-y-4 rounded-[1.5rem] border border-[var(--border)] bg-[#fbf8f1] p-5">
                <div>
                  <p className="text-sm font-semibold text-[var(--foreground)]">
                    Vald management details
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                    This helps Heyra avoid treating a shared big-game area like a simple single-owner listing.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-sm font-semibold text-[var(--foreground)]">
                      Governance confidence
                    </label>
                    <select
                      value={values.governanceConfidence}
                      onChange={(event) =>
                        setValues((current) => ({
                          ...current,
                          governanceConfidence: event.target.value as ConfidenceLevel,
                        }))
                      }
                      className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none"
                    >
                      {confidenceOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <input
                    value={values.valdLocalReference}
                    onChange={(event) =>
                      setValues((current) => ({
                        ...current,
                        valdLocalReference: event.target.value,
                      }))
                    }
                    placeholder="Municipal case, vald number, or local reference"
                    className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none sm:col-span-2"
                  />
                  <select
                    value={values.valdVerificationMethod}
                    onChange={(event) =>
                      setValues((current) => ({
                        ...current,
                        valdVerificationMethod: event.target.value as ValdVerificationMethod,
                      }))
                    }
                    className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none sm:col-span-2"
                  >
                    {verificationOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={values.valdDataConfidence}
                    onChange={(event) =>
                      setValues((current) => ({
                        ...current,
                        valdDataConfidence: event.target.value as ConfidenceLevel,
                      }))
                    }
                    className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none sm:col-span-2"
                  >
                    {confidenceOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {`Overall vald data: ${option.label}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <input
                    value={values.valdRepresentativeName}
                    onChange={(event) =>
                      setValues((current) => ({
                        ...current,
                        valdRepresentativeName: event.target.value,
                      }))
                    }
                    placeholder="Valdansvarlig or contact name"
                    className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none"
                  />
                  <input
                    value={values.valdRepresentativePhone}
                    onChange={(event) =>
                      setValues((current) => ({
                        ...current,
                        valdRepresentativePhone: event.target.value,
                      }))
                    }
                    placeholder="Representative phone"
                    className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none"
                  />
                  <input
                    value={values.valdRepresentativeEmail}
                    onChange={(event) =>
                      setValues((current) => ({
                        ...current,
                        valdRepresentativeEmail: event.target.value,
                      }))
                    }
                    placeholder="Representative email"
                    className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none"
                  />
                  <input
                    value={values.valdBestandsplanName}
                    onChange={(event) =>
                      setValues((current) => ({
                        ...current,
                        valdBestandsplanName: event.target.value,
                      }))
                    }
                    placeholder="Bestandsplan name (optional)"
                    className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none"
                  />
                  <input
                    value={values.valdAuthorityContactName}
                    onChange={(event) =>
                      setValues((current) => ({
                        ...current,
                        valdAuthorityContactName: event.target.value,
                      }))
                    }
                    placeholder="Municipal or authority contact name"
                    className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none"
                  />
                  <input
                    value={values.valdAuthorityContactPhone}
                    onChange={(event) =>
                      setValues((current) => ({
                        ...current,
                        valdAuthorityContactPhone: event.target.value,
                      }))
                    }
                    placeholder="Authority contact phone"
                    className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none"
                  />
                  <input
                    value={values.valdAuthorityContactEmail}
                    onChange={(event) =>
                      setValues((current) => ({
                        ...current,
                        valdAuthorityContactEmail: event.target.value,
                      }))
                    }
                    placeholder="Authority contact email"
                    className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none sm:col-span-2"
                  />
                  <select
                    value={values.representativeConfirmationStatus}
                    onChange={(event) =>
                      setValues((current) => ({
                        ...current,
                        representativeConfirmationStatus: event.target.value as SharedApprovalStatus,
                      }))
                    }
                    className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none sm:col-span-2"
                  >
                    {representativeConfirmationOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {`Representative status: ${option.label}`}
                      </option>
                    ))}
                  </select>
                </div>

                <label className="flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-white px-4 py-4 text-sm text-[var(--foreground)]">
                  <input
                    type="checkbox"
                    checked={values.valdCoApprovalRequired}
                    onChange={(event) =>
                      setValues((current) => ({
                        ...current,
                        valdCoApprovalRequired: event.target.checked,
                      }))
                    }
                    className="mt-1"
                  />
                  <span>
                    Listings from this area require coordination or co-approval before they should be treated as ready.
                  </span>
                </label>

                <textarea
                  value={values.valdNotes}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      valdNotes: event.target.value,
                    }))
                  }
                  rows={4}
                  placeholder="Explain how this property sits inside the wider area, who approves bookings, or how quota is coordinated."
                  className="w-full rounded-[1.4rem] border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none"
                />
              </div>
            ) : null}
          </div>
        ) : null}

        {currentStep.key === "review" ? (
          <div className="space-y-4">
            <div className="rounded-[1.5rem] border border-[var(--border)] bg-[#f8f5ed] p-5">
              <p className="text-sm font-semibold text-[var(--foreground)]">Review your draft</p>
              <dl className="mt-4 grid gap-3 text-sm leading-7 text-[var(--muted)]">
                <div>
                  <dt className="font-semibold text-[var(--foreground)]">Cadastral number</dt>
                  <dd>{values.cadastralRef}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-[var(--foreground)]">Municipality and county</dt>
                  <dd>
                    {values.municipality}, {values.county}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-[var(--foreground)]">Area</dt>
                  <dd>{values.areaHectares} hectares</dd>
                </div>
                <div>
                  <dt className="font-semibold text-[var(--foreground)]">Terrain</dt>
                  <dd>{formatTerrainTypes(values.terrainTypes)}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-[var(--foreground)]">Vald context</dt>
                  <dd>{values.valdName.trim() ? values.valdName : "Ingen vald- eller felleskontekst lagt til"}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-[var(--foreground)]">Confidence</dt>
                  <dd>
                    Geometri {formatConfidenceLevel(values.geometryConfidence)} · rettigheter {formatConfidenceLevel(values.rightsConfidence)} · styring {formatConfidenceLevel(values.governanceConfidence)}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-[var(--foreground)]">Boundary warnings</dt>
                  <dd>
                    {[
                      values.boundaryIsApproximate ? "Omtrentlig grense" : null,
                      values.rightsDifferFromBoundary ? "Rettigheter avviker fra kartlagt eiendom" : null,
                    ]
                      .filter(Boolean)
                      .join(", ") || "Ingen spesielle merknader lagt til"}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-[var(--foreground)]">Representative confirmation</dt>
                  <dd>
                    {representativeConfirmationOptions.find(
                      (option) => option.value === values.representativeConfirmationStatus,
                    )?.label ?? formatSharedApprovalStatus(SharedApprovalStatus.NOT_REQUESTED)}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-[var(--foreground)]">Vald-verifisering</dt>
                  <dd>{formatValdVerificationMethod(values.valdVerificationMethod)}</dd>
                </div>
              </dl>
            </div>

            <p className="text-sm leading-7 text-[var(--muted)]">
              Du lagrer bare et utkast på dette steget. Grense, arter og publisering kan tas senere i mindre steg.
            </p>
          </div>
        ) : null}

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

        <div className="flex flex-wrap gap-3">
          {stepIndex > 0 ? (
            <button
              type="button"
              onClick={goBack}
              className="rounded-full border border-[var(--border)] px-5 py-3 text-sm font-semibold text-[var(--foreground)]"
            >
              Tilbake
            </button>
          ) : null}

          {stepIndex < steps.length - 1 ? (
            <button
              type="button"
              onClick={goNext}
              className="rounded-full bg-[var(--forest)] px-5 py-3 text-sm font-semibold text-[var(--background)]"
            >
              Fortsett
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isSubmitting}
              className="rounded-full bg-[var(--forest)] px-5 py-3 text-sm font-semibold text-[var(--background)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Lagrer utkast..." : "Lagre eiendomsutkast"}
            </button>
          )}
        </div>
      </section>

      <aside className="space-y-4">
        <section className="rounded-[1.8rem] bg-[var(--forest)] p-6 text-[var(--background)]">
          <p className="text-sm font-semibold uppercase tracking-[0.26em] text-white/65">
            Laget for roligere tempo
          </p>
          <p className="mt-4 text-base leading-8 text-white/78">
            Denne veiviseren bruker korte steg, enkle etiketter og lagring som utkast, slik at grunneiere ikke trenger å fullføre alt i én økt.
          </p>
        </section>

        <section className="rounded-[1.8rem] border border-[var(--border)] bg-white/80 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--amber)]">
            Offisielle hjelpelinker
          </p>
          <div className="mt-4 space-y-4">
            {helpLinks.map((link) => (
              <article key={link.href} className="rounded-2xl border border-[var(--border)] p-4">
                <h3 className="text-sm font-semibold text-[var(--foreground)]">
                  <Link href={link.href} target="_blank" rel="noreferrer" className="underline-offset-4 hover:underline">
                    {link.title}
                  </Link>
                </h3>
                <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{link.description}</p>
              </article>
            ))}
          </div>
        </section>
      </aside>
    </div>
  );
}
