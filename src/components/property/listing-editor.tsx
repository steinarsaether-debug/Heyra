"use client";

import {
  CancellationPolicy,
  ConfidenceLevel,
  ListingGovernanceModel,
  ListingStatus,
  ListingType,
  PricingModel,
  SharedApprovalStatus,
  Species,
  ValdVerificationMethod,
} from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  formatCancellationPolicy,
  formatListingConfidence,
  formatListingGovernanceModel,
  formatListingStatus,
  formatListingType,
  formatPricingModel,
  formatSpecies,
  getBigGameGovernanceReadiness,
  isBigGameListing,
} from "@/lib/listing-view";
import { formatSharedApprovalStatus, formatValdVerificationMethod } from "@/lib/property-view";

type PropertySummary = {
  id: string;
  cadastralRef: string;
  municipality: string;
  county: string;
  status: string;
  hasBoundary: boolean;
  geometryConfidence: ConfidenceLevel;
  rightsConfidence: ConfidenceLevel;
  governanceConfidence: ConfidenceLevel;
  boundaryIsApproximate: boolean;
  rightsDifferFromBoundary: boolean;
  rightsOverlays: Array<{
    id: string;
    title: string;
    overlayType: string;
    visibility: string;
  }>;
  vald: {
    id: string;
    name: string;
    municipality: string;
    county: string;
    representativeName: string;
    localReference: string | null;
    verificationMethod: string;
    dataConfidence: ConfidenceLevel;
    representativeConfirmationStatus: SharedApprovalStatus;
    coApprovalRequired: boolean;
  } | null;
};

type ListingSummary = {
  id: string;
  slug: string;
  type: ListingType;
  title: string;
  description: string;
  species: Species[];
  pricingModel: PricingModel;
  priceNok: number;
  maxGroupSize: number;
  minNights: number | null;
  photos: string[];
  instantBookEnabled: boolean;
  cancellationPolicy: CancellationPolicy;
  governanceModel: ListingGovernanceModel;
  coApprovalRequired: boolean;
  governanceNotes: string | null;
  governanceEvidenceNotes?: string | null;
  municipalityProcessNotes?: string | null;
  reviewerNotes?: string | null;
  quota: {
    summary: string;
    availabilitySummary: string;
    permitNotes: string;
    reportingNotes: string;
    reportingResponsibility: string;
  };
  rules: {
    speciesRestrictions: string;
    gearRules: string;
    bagLimitNotes: string;
    areaNotes: string;
    requiresNationalFishingLicense: boolean;
    publicRightsOverlayId: string | null;
  };
  availabilityCalendar: {
    seasonNotes: string;
    blockedRanges: Array<{
      startDate: string;
      endDate: string;
      label?: string;
    }>;
  };
  status: ListingStatus;
};

type ComplianceTaskSummary = {
  id: string;
  title: string;
  taskTypeLabel: string;
  statusLabel: string;
  dueLabel: string;
  actionLabel?: string | null;
  actionUrl?: string | null;
};

const speciesOptions = Object.values(Species);
const typeOptions = Object.values(ListingType);
const pricingOptions = Object.values(PricingModel);
const governanceOptions = Object.values(ListingGovernanceModel);
const cancellationOptions = Object.values(CancellationPolicy);

function formatEnumLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function ListingEditor({
  property,
  listing,
  complianceTasks,
}: {
  property: PropertySummary;
  listing: ListingSummary | null;
  complianceTasks: ComplianceTaskSummary[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState(listing?.title ?? `${property.municipality} ${property.cadastralRef}`);
  const [description, setDescription] = useState(
    listing?.description ??
      "Beskriv terrenget, adkomsten, aktuelle arter, overnatting eller fasiliteter, og hvilken opplevelse jegeren eller fiskeren kan forvente.",
  );
  const [type, setType] = useState<ListingType>(listing?.type ?? ListingType.HUNTING);
  const [species, setSpecies] = useState<Species[]>(listing?.species ?? []);
  const [pricingModel, setPricingModel] = useState<PricingModel>(listing?.pricingModel ?? PricingModel.PER_DAY);
  const [priceNok, setPriceNok] = useState(String(listing?.priceNok ?? 2500));
  const [maxGroupSize, setMaxGroupSize] = useState(String(listing?.maxGroupSize ?? 2));
  const [minNights, setMinNights] = useState(String(listing?.minNights ?? 1));
  const [photos, setPhotos] = useState<string[]>(listing?.photos ?? []);
  const [instantBookEnabled, setInstantBookEnabled] = useState(
    listing?.instantBookEnabled ?? (listing?.type ?? ListingType.FISHING) === ListingType.FISHING,
  );
  const [cancellationPolicy, setCancellationPolicy] = useState<CancellationPolicy>(
    listing?.cancellationPolicy ?? CancellationPolicy.MODERATE,
  );
  const [governanceModel, setGovernanceModel] = useState<ListingGovernanceModel>(
    listing?.governanceModel ??
      (property.vald ? ListingGovernanceModel.VALD_MANAGED : ListingGovernanceModel.INDIVIDUAL_PROPERTY),
  );
  const [coApprovalRequired, setCoApprovalRequired] = useState(
    listing?.coApprovalRequired ?? Boolean(property.vald?.coApprovalRequired),
  );
  const [governanceNotes, setGovernanceNotes] = useState(
    listing?.governanceNotes ??
      (property.vald
        ? `Denne eiendommen er del av ${property.vald.name}. Bekreft kvote, tilgang og godkjenninger med valdansvarlig før endelig bekreftelse.`
        : ""),
  );
  const [governanceEvidenceNotes, setGovernanceEvidenceNotes] = useState(
    listing?.governanceEvidenceNotes ?? "",
  );
  const [municipalityProcessNotes, setMunicipalityProcessNotes] = useState(
    listing?.municipalityProcessNotes ?? "",
  );
  const [quotaSummary, setQuotaSummary] = useState(listing?.quota.summary ?? "");
  const [availabilitySummary, setAvailabilitySummary] = useState(
    listing?.quota.availabilitySummary ?? "",
  );
  const [permitNotes, setPermitNotes] = useState(listing?.quota.permitNotes ?? "");
  const [reportingNotes, setReportingNotes] = useState(listing?.quota.reportingNotes ?? "");
  const [reportingResponsibility, setReportingResponsibility] = useState(
    listing?.quota.reportingResponsibility ?? "",
  );
  const [speciesRestrictions, setSpeciesRestrictions] = useState(listing?.rules.speciesRestrictions ?? "");
  const [gearRules, setGearRules] = useState(listing?.rules.gearRules ?? "");
  const [bagLimitNotes, setBagLimitNotes] = useState(listing?.rules.bagLimitNotes ?? "");
  const [areaNotes, setAreaNotes] = useState(listing?.rules.areaNotes ?? "");
  const [requiresNationalFishingLicense, setRequiresNationalFishingLicense] = useState(
    listing?.rules.requiresNationalFishingLicense ?? false,
  );
  const [publicRightsOverlayId, setPublicRightsOverlayId] = useState(
    listing?.rules.publicRightsOverlayId ?? "",
  );
  const [seasonNotes, setSeasonNotes] = useState(listing?.availabilityCalendar.seasonNotes ?? "");
  const [blockedRanges, setBlockedRanges] = useState(
    listing?.availabilityCalendar.blockedRanges.length
      ? listing.availabilityCalendar.blockedRanges
      : [{ startDate: "", endDate: "", label: "" }],
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentListing, setCurrentListing] = useState<ListingSummary | null>(listing);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const containsBigGame = isBigGameListing(species);
  const shouldWarnAboutVald =
    containsBigGame &&
    (!property.vald || governanceModel === ListingGovernanceModel.INDIVIDUAL_PROPERTY);
  const governanceReadiness = getBigGameGovernanceReadiness({
    governanceNotes,
    quota: {
      summary: quotaSummary,
      availabilitySummary,
      permitNotes,
      reportingNotes,
      reportingResponsibility,
    },
    governanceModel,
    hasVald: Boolean(property.vald),
  });
  const hasTrustWarnings =
    property.boundaryIsApproximate ||
    property.rightsDifferFromBoundary ||
    property.geometryConfidence === ConfidenceLevel.LOW ||
    property.rightsConfidence === ConfidenceLevel.LOW ||
    property.governanceConfidence === ConfidenceLevel.LOW;

  const checklist = useMemo(
    () => [
      { label: "Grense er registrert for eiendommen", complete: property.hasBoundary },
      { label: "Annonsetittel er fylt ut", complete: title.trim().length >= 6 },
      { label: "Beskrivelsen er detaljert nok", complete: description.trim().length >= 40 },
      { label: "Minst en art er valgt", complete: species.length > 0 },
      { label: "Minst ett bilde er lastet opp", complete: photos.length > 0 },
      {
        label: "Styring og godkjenning er forklart for tilbudet",
        complete: !containsBigGame || governanceNotes.trim().length >= 20,
      },
      {
        label: "Usikkerhet rundt grense eller rettigheter er forklart tydelig",
        complete:
          !hasTrustWarnings ||
          governanceNotes.toLowerCase().includes("omtrent") ||
          governanceNotes.toLowerCase().includes("represent") ||
          governanceNotes.toLowerCase().includes("rett"),
      },
      {
        label: "Dokumentasjon eller kommunenotater er lagt til når styringen er mindre formell",
        complete:
          !property.vald ||
          property.vald.representativeConfirmationStatus === SharedApprovalStatus.CONFIRMED ||
          Boolean(governanceEvidenceNotes.trim() || municipalityProcessNotes.trim()),
      },
      {
        label: "Kvote eller tillatelser er forklart",
        complete:
          !containsBigGame ||
          quotaSummary.trim().length >= 8 ||
          permitNotes.trim().length >= 12,
      },
      {
        label: "Kvotegrunnlag og rapporteringsansvar er forklart",
        complete:
          !containsBigGame ||
          (availabilitySummary.trim().length >= 8 &&
            reportingResponsibility.trim().length >= 8),
      },
      {
        label: "Regler og avgrensning av området er forklart",
        complete:
          type !== ListingType.FISHING ||
          gearRules.trim().length >= 8 ||
          bagLimitNotes.trim().length >= 8 ||
          areaNotes.trim().length >= 8,
      },
      {
        label: "Offentlig rettighetslag er valgt når tilbudsområdet avviker fra eiendommen",
        complete:
          !property.rightsDifferFromBoundary ||
          property.rightsOverlays.length === 0 ||
          Boolean(publicRightsOverlayId),
      },
    ],
    [
      containsBigGame,
      description,
      governanceEvidenceNotes,
      gearRules,
      governanceNotes,
      municipalityProcessNotes,
      areaNotes,
      bagLimitNotes,
      permitNotes,
      availabilitySummary,
      reportingResponsibility,
      photos.length,
      property.hasBoundary,
      property.rightsDifferFromBoundary,
      property.rightsOverlays.length,
      property.vald,
      publicRightsOverlayId,
      hasTrustWarnings,
      quotaSummary,
      species.length,
      title,
      type,
    ],
  );

  async function ensureListingExists() {
    if (currentListing) {
      return currentListing.id;
    }

    const response = await fetch(`/api/properties/${property.id}/listing`, {
      method: "POST",
    });
    const data = (await response.json()) as { error?: string; listingId?: string };

      if (!response.ok || !data.listingId) {
      throw new Error(data.error ?? "Kunne ikke opprette annonseutkast.");
    }

    return data.listingId;
  }

  async function handleSave() {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await ensureListingExists();

      const response = await fetch(`/api/properties/${property.id}/listing`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type,
          title,
          description,
          species,
          pricingModel,
          priceNok,
          maxGroupSize,
          minNights: minNights.trim() ? minNights : null,
          photoUrls: photos,
          instantBookEnabled,
          cancellationPolicy,
          governanceModel,
          coApprovalRequired,
          governanceNotes,
          governanceEvidenceNotes,
          municipalityProcessNotes,
          quota: {
            summary: quotaSummary,
            availabilitySummary,
            permitNotes,
            reportingNotes,
            reportingResponsibility,
          },
          rules: {
            speciesRestrictions,
            gearRules,
            bagLimitNotes,
            areaNotes,
            requiresNationalFishingLicense,
            publicRightsOverlayId: publicRightsOverlayId || null,
          },
          availability: {
            seasonNotes,
            blockedRanges: blockedRanges.filter((range) => range.startDate && range.endDate),
          },
        }),
      });

      const data = (await response.json()) as {
        error?: string;
        listing?: ListingSummary;
      };

      if (!response.ok || !data.listing) {
        throw new Error(data.error ?? "Kunne ikke lagre annonsen.");
      }

      setCurrentListing((existing) => ({
        ...(existing ?? {}),
        id: data.listing!.id,
        slug: data.listing!.slug,
        status: data.listing!.status,
        type,
        title,
        description,
        species,
        pricingModel,
        priceNok: Number(priceNok),
        maxGroupSize: Number(maxGroupSize),
        minNights: minNights.trim() ? Number(minNights) : null,
        photos,
        instantBookEnabled,
        cancellationPolicy,
        governanceModel,
        coApprovalRequired,
        governanceNotes,
        governanceEvidenceNotes,
        municipalityProcessNotes,
        quota: {
          summary: quotaSummary,
          availabilitySummary,
          permitNotes,
          reportingNotes,
          reportingResponsibility,
        },
        rules: {
          speciesRestrictions,
          gearRules,
          bagLimitNotes,
          areaNotes,
          requiresNationalFishingLicense,
          publicRightsOverlayId: publicRightsOverlayId || null,
        },
        availabilityCalendar: {
          seasonNotes,
          blockedRanges: blockedRanges.filter((range) => range.startDate && range.endDate),
        },
      }));
      setSuccess("Annonseutkast lagret.");
      router.refresh();
      return true;
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Kunne ikke lagre annonsen.");
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  async function handleStatusChange(action: "submit_for_review" | "save_draft" | "archive") {
    setIsChangingStatus(true);
    setError(null);
    setSuccess(null);

    try {
      const listingId = await ensureListingExists();
      const saved = await handleSave();

      if (!saved) {
        throw new Error("Rett opp annonsedetaljene før du endrer status.");
      }

      const response = await fetch(`/api/listings/${listingId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });

      const data = (await response.json()) as {
        error?: string;
        listing?: { status: ListingStatus };
      };

      if (!response.ok || !data.listing) {
        throw new Error(data.error ?? "Kunne ikke endre annonsestatus.");
      }

      setCurrentListing((existing) =>
        existing
          ? {
              ...existing,
              status: data.listing!.status,
            }
          : existing,
      );
      setSuccess(
        action === "submit_for_review"
          ? "Annonsen er sendt til gjennomgang."
          : action === "archive"
            ? "Annonsen er arkivert."
            : "Annonsen er flyttet tilbake til utkast.",
      );
      router.refresh();
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : "Kunne ikke endre annonsestatus.");
    } finally {
      setIsChangingStatus(false);
    }
  }

  function toggleSpecies(selected: Species) {
    setSpecies((current) =>
      current.includes(selected)
        ? current.filter((item) => item !== selected)
        : [...current, selected],
    );
  }

  async function handlePhotoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);

    if (files.length === 0) {
      return;
    }

    setIsUploadingPhotos(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();

      for (const file of files) {
        formData.append("files", file);
      }

      const response = await fetch(`/api/properties/${property.id}/listing/photos`, {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as {
        error?: string;
        uploads?: Array<{ url: string }>;
      };

      if (!response.ok || !data.uploads) {
        throw new Error(data.error ?? "Kunne ikke laste opp bildene.");
      }

      setPhotos((current) => [...current, ...data.uploads!.map((item) => item.url)]);
      setSuccess(`${data.uploads.length} bilde${data.uploads.length === 1 ? "" : "r"} lastet opp.`);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Kunne ikke laste opp bildene.");
    } finally {
      setIsUploadingPhotos(false);
    }
  }

  function removePhoto(photoUrl: string) {
    setPhotos((current) => current.filter((item) => item !== photoUrl));
  }

  function updateBlockedRange(index: number, key: "startDate" | "endDate" | "label", value: string) {
    setBlockedRanges((current) =>
      current.map((range, currentIndex) =>
        currentIndex === index ? { ...range, [key]: value } : range,
      ),
    );
  }

  function addBlockedRange() {
    setBlockedRanges((current) => [...current, { startDate: "", endDate: "", label: "" }]);
  }

  function removeBlockedRange(index: number) {
    setBlockedRanges((current) => current.filter((_, currentIndex) => currentIndex !== index));
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <section className="space-y-6 rounded-[1.8rem] border border-[var(--border)] bg-white/80 p-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--amber)]">
            Annonseredigering
          </p>
          <h2 className="mt-3 text-3xl text-[var(--forest)]">
            Gjør eiendommen om til et offentlig tilbud.
          </h2>
          <p className="mt-3 max-w-3xl text-base leading-8 text-[var(--muted)]">
            Hold dette rolig og praktisk. Skriv annonsen tydelig, legg til noen troverdige bilder, og send den til gjennomgang når grunnlaget er på plass.
          </p>
        </div>

        {shouldWarnAboutVald ? (
          <div className="rounded-[1.4rem] border border-[#e7d6ae] bg-[#fff8eb] px-5 py-4 text-sm leading-7 text-[#6e5630]">
            Storvilttilbud ligger ofte innenfor et delt <span className="font-semibold">vald</span> eller jaktområde. Pass på at annonsen forklarer hvem som godkjenner tilgang, kvote og datoer, slik at jegeren ikke loves mer enn en enkelt grunneier faktisk kan bestemme alene.
          </div>
        ) : null}
        {containsBigGame && !governanceReadiness.ready ? (
          <div className="rounded-[1.4rem] border border-[#d8c4a0] bg-[#fff9ef] px-5 py-4 text-sm leading-7 text-[#6b5432]">
            For gjennomgang mangler storviltannonsen fortsatt: {governanceReadiness.issues.join(" ")}
          </div>
        ) : null}
        {hasTrustWarnings ? (
          <div className="rounded-[1.4rem] border border-[#e7d6ae] bg-[#fff8eb] px-5 py-4 text-sm leading-7 text-[#6e5630]">
            Denne eiendommen har usikkerhet knyttet til kartfestet grense, faktisk rettighetsområde eller delt styring. Gjør dette tydelig i annonsen slik at jegeren forstår hva som er omtrentlig, og hva som fortsatt avhenger av vald eller kommunal bekreftelse.
          </div>
        ) : null}
        {complianceTasks.length > 0 ? (
          <div className="rounded-[1.4rem] border border-[#d8c4a0] bg-[#fff9ef] px-5 py-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-[#6b5432]">Etterlevelse å følge opp før publisering</p>
                <p className="text-sm leading-7 text-[#6b5432]">
                  Denne annonsen har åpne oppgaver. Ta den første fristen nå, så blir gjennomgang og publisering enklere.
                </p>
                <div className="grid gap-2 pt-1">
                  {complianceTasks.slice(0, 2).map((task) => (
                    <div
                      key={task.id}
                      className="rounded-2xl border border-[#eadcc0] bg-white/70 px-4 py-3 text-sm leading-7 text-[#6b5432]"
                    >
                      <span className="font-semibold">{task.taskTypeLabel}</span>
                      {" · "}
                      {task.statusLabel}
                      <br />
                      {task.title}
                      <br />
                      <span className="text-[#8a6a3f]">{task.dueLabel}</span>
                      {task.actionUrl ? (
                        <div className="mt-3">
                          <Link
                            href={task.actionUrl}
                            className="inline-flex rounded-full border border-[#d8c4a0] bg-white px-4 py-2 text-sm font-semibold text-[#6b5432]"
                          >
                            {task.actionLabel ?? "Åpne oppgave"}
                          </Link>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap gap-3">
                <Link
                  href="/dashboard/compliance"
                  className="rounded-full border border-[#d8c4a0] bg-white px-4 py-2 text-sm font-semibold text-[#6b5432]"
                >
                  Åpne etterlevelse
                </Link>
              </div>
            </div>
          </div>
        ) : null}

        {currentListing?.reviewerNotes ? (
          <div className="rounded-[1.4rem] border border-[#d8c4a0] bg-[#fff9ef] px-5 py-4 text-sm leading-7 text-[#6b5432]">
            Merknad fra gjennomgang: {currentListing.reviewerNotes}
          </div>
        ) : null}

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-semibold text-[var(--foreground)]" htmlFor="title">
              Offentlig tittel
            </label>
            <input
              id="title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-base outline-none transition focus:border-[var(--amber)]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-[var(--foreground)]" htmlFor="type">
              Tilbudstype
            </label>
            <select
              id="type"
              value={type}
              onChange={(event) => setType(event.target.value as ListingType)}
              className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-base outline-none transition focus:border-[var(--amber)]"
            >
              {typeOptions.map((option) => (
                <option key={option} value={option}>
                  {formatListingType(option)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-[var(--foreground)]" htmlFor="pricingModel">
              Prismodell
            </label>
            <select
              id="pricingModel"
              value={pricingModel}
              onChange={(event) => setPricingModel(event.target.value as PricingModel)}
              className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-base outline-none transition focus:border-[var(--amber)]"
            >
              {pricingOptions.map((option) => (
                <option key={option} value={option}>
                  {formatPricingModel(option)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-semibold text-[var(--foreground)]" htmlFor="governanceModel">
              Hvem styrer tilbudet
            </label>
            <select
              id="governanceModel"
              value={governanceModel}
              onChange={(event) => setGovernanceModel(event.target.value as ListingGovernanceModel)}
              className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-base outline-none transition focus:border-[var(--amber)]"
            >
              {governanceOptions.map((option) => (
                <option key={option} value={option}>
                  {formatListingGovernanceModel(option)}
                </option>
              ))}
            </select>
            <p className="text-sm leading-6 text-[var(--muted)]">
              Bruk <span className="font-semibold">Valdstyrt</span> når kvoter, godkjenninger eller tilgang samordnes på tvers av et større jaktområde.
            </p>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-semibold text-[var(--foreground)]" htmlFor="description">
              Offentlig beskrivelse
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={8}
              className="w-full rounded-[1.5rem] border border-[var(--border)] bg-white px-4 py-3 text-base outline-none transition focus:border-[var(--amber)]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-[var(--foreground)]" htmlFor="priceNok">
              Pris i NOK
            </label>
            <input
              id="priceNok"
              type="number"
              min="1"
              value={priceNok}
              onChange={(event) => setPriceNok(event.target.value)}
              className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-base outline-none transition focus:border-[var(--amber)]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-[var(--foreground)]" htmlFor="maxGroupSize">
              Maks gruppestorrelse
            </label>
            <input
              id="maxGroupSize"
              type="number"
              min="1"
              value={maxGroupSize}
              onChange={(event) => setMaxGroupSize(event.target.value)}
              className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-base outline-none transition focus:border-[var(--amber)]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-[var(--foreground)]" htmlFor="minNights">
              Minste antall netter
            </label>
            <input
              id="minNights"
              type="number"
              min="1"
              value={minNights}
              onChange={(event) => setMinNights(event.target.value)}
              className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-base outline-none transition focus:border-[var(--amber)]"
            />
          </div>

          <div className="space-y-3 sm:col-span-2 rounded-[1.5rem] border border-[var(--border)] bg-[#fbf8f1] p-5">
            <div>
              <p className="text-sm font-semibold text-[var(--foreground)]">Kjøp og avbestilling</p>
              <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                Velg om tilbudet kan kjøpes direkte, og hvordan avbestillinger skal håndteres etter at betaling er godkjent.
              </p>
            </div>
            <label className="flex items-center gap-3 text-sm text-[var(--foreground)]">
              <input
                type="checkbox"
                checked={instantBookEnabled}
                onChange={(event) => setInstantBookEnabled(event.target.checked)}
                className="h-4 w-4 rounded border-[var(--border)]"
              />
              {type === ListingType.FISHING
                ? "Tillat direkte kjøp av fiskekort"
                : "Tillat direkte bekreftelse etter kontrakt og betaling"}
            </label>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[var(--foreground)]" htmlFor="cancellationPolicy">
                Avbestillingsvilkår
              </label>
              <select
                id="cancellationPolicy"
                value={cancellationPolicy}
                onChange={(event) => setCancellationPolicy(event.target.value as CancellationPolicy)}
                className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-base outline-none transition focus:border-[var(--amber)]"
              >
                {cancellationOptions.map((option) => (
                  <option key={option} value={option}>
                    {formatCancellationPolicy(option)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-3 sm:col-span-2 rounded-[1.5rem] border border-[var(--border)] bg-[#fbf8f1] p-5">
            <div>
              <p className="text-sm font-semibold text-[var(--foreground)]">Godkjenning og styringsnotater</p>
              <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                Forklar hvem som tar endelig beslutning om tilgang, om området ligger i et vald, og hva jegeren må forvente om tillatelser eller medgodkjenning.
              </p>
            </div>
            {property.vald ? (
              <div className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm leading-7 text-[var(--foreground)]">
                Knyttet til vald: <span className="font-semibold">{property.vald.name}</span> i {property.vald.municipality}, {property.vald.county}. Valdansvarlig: {property.vald.representativeName}.
                {property.vald.localReference ? ` Referanse: ${property.vald.localReference}.` : ""}
                {` Verifisering: ${formatValdVerificationMethod(property.vald.verificationMethod as ValdVerificationMethod)}.`}
                {` Status for valdansvarlig: ${formatSharedApprovalStatus(property.vald.representativeConfirmationStatus)}.`}
              </div>
            ) : null}
            <label className="flex items-center gap-3 text-sm text-[var(--foreground)]">
              <input
                type="checkbox"
                checked={coApprovalRequired}
                onChange={(event) => setCoApprovalRequired(event.target.checked)}
                className="h-4 w-4 rounded border-[var(--border)]"
              />
              Tilbudet krever medgodkjenning for datoer eller kvoter blir endelige
            </label>
            {property.rightsOverlays.length > 0 ? (
              <div className="space-y-2 rounded-2xl border border-[var(--border)] bg-white px-4 py-4">
                <label
                  className="text-sm font-semibold text-[var(--foreground)]"
                  htmlFor="publicRightsOverlayId"
                >
                  Offentlig kartområde
                </label>
                <select
                  id="publicRightsOverlayId"
                  value={publicRightsOverlayId}
                  onChange={(event) => setPublicRightsOverlayId(event.target.value)}
                  className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-base outline-none transition focus:border-[var(--amber)]"
                >
                  <option value="">Bruk eiendomsgrensen offentlig</option>
                  {property.rightsOverlays.map((overlay) => (
                    <option key={overlay.id} value={overlay.id}>
                      {overlay.title} · {formatEnumLabel(overlay.overlayType)}
                    </option>
                  ))}
                </select>
                <p className="text-sm leading-6 text-[var(--muted)]">
                  Velg et offentlig rettighetslag når området du leier ut er smalere enn selve eiendommen. La dette stå på eiendomsgrensen hvis det er trygt at hele eiendomsomrisset vises offentlig.
                </p>
              </div>
            ) : null}
            <textarea
              value={governanceNotes}
              onChange={(event) => setGovernanceNotes(event.target.value)}
              rows={4}
              className="w-full rounded-[1.25rem] border border-[var(--border)] bg-white px-4 py-3 text-base outline-none transition focus:border-[var(--amber)]"
              placeholder="Eksempel: Denne teigen er del av et delt vald. Endelig godkjenning bekreftes med valdansvarlig etter vurdering av kvote og naboplaner."
            />
            <textarea
              value={governanceEvidenceNotes}
              onChange={(event) => setGovernanceEvidenceNotes(event.target.value)}
              rows={3}
              className="w-full rounded-[1.25rem] border border-[var(--border)] bg-white px-4 py-3 text-base outline-none transition focus:border-[var(--amber)]"
              placeholder="Valgfritt: noter dokumenter, telefonsamtaler, møtenotater eller annen lokal dokumentasjon som støtter oppsettet."
            />
            <textarea
              value={municipalityProcessNotes}
              onChange={(event) => setMunicipalityProcessNotes(event.target.value)}
              rows={3}
              className="w-full rounded-[1.25rem] border border-[var(--border)] bg-white px-4 py-3 text-base outline-none transition focus:border-[var(--amber)]"
              placeholder="Valgfritt: forklar hvis området fortsatt håndteres gjennom kommunale papir-, PDF- eller manuelle rutiner fremfor en ryddig digital prosess."
            />
          </div>

          <div className="space-y-3 sm:col-span-2 rounded-[1.5rem] border border-[var(--border)] bg-[#fbf8f1] p-5">
            <div>
              <p className="text-sm font-semibold text-[var(--foreground)]">Kvote og tillatelser</p>
              <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                Særlig for storvilttilbud bør du forklare hva som faktisk inngår, hva som fortsatt er tilgjengelig innenfor felleskvoten, og hvem som har rapporteringsansvaret etter turen.
              </p>
            </div>
            <textarea
              value={quotaSummary}
              onChange={(event) => setQuotaSummary(event.target.value)}
              rows={3}
              className="w-full rounded-[1.25rem] border border-[var(--border)] bg-white px-4 py-3 text-base outline-none transition focus:border-[var(--amber)]"
              placeholder="Eksempel: En voksen elg kan være mulig innenfor felleskvoten, avhengig av endelig tildeling i valdet."
            />
            <textarea
              value={availabilitySummary}
              onChange={(event) => setAvailabilitySummary(event.target.value)}
              rows={3}
              className="w-full rounded-[1.25rem] border border-[var(--border)] bg-white px-4 py-3 text-base outline-none transition focus:border-[var(--amber)]"
              placeholder="Eksempel: To kalveplasser virker realistiske akkurat nå, men voksentildeling avklares fortsatt med valdet."
            />
            <textarea
              value={permitNotes}
              onChange={(event) => setPermitNotes(event.target.value)}
              rows={3}
              className="w-full rounded-[1.25rem] border border-[var(--border)] bg-white px-4 py-3 text-base outline-none transition focus:border-[var(--amber)]"
              placeholder="Eksempel: Jegeravgiften må være gyldig, og lokal tillatelse bekreftes med valdet før jakta starter."
            />
            <textarea
              value={reportingNotes}
              onChange={(event) => setReportingNotes(event.target.value)}
              rows={3}
              className="w-full rounded-[1.25rem] border border-[var(--border)] bg-white px-4 py-3 text-base outline-none transition focus:border-[var(--amber)]"
              placeholder="Eksempel: Fellings- og observasjonsrapportering skal sendes inn samme dag etter jakta."
            />
            <textarea
              value={reportingResponsibility}
              onChange={(event) => setReportingResponsibility(event.target.value)}
              rows={3}
              className="w-full rounded-[1.25rem] border border-[var(--border)] bg-white px-4 py-3 text-base outline-none transition focus:border-[var(--amber)]"
              placeholder="Eksempel: Jegeren melder felling til grunneier samme dag, og valdansvarlig sender inn den formelle oppfølgingen."
            />
          </div>

          <div className="space-y-3 sm:col-span-2 rounded-[1.5rem] border border-[var(--border)] bg-[#fbf8f1] p-5">
            <div>
              <p className="text-sm font-semibold text-[var(--foreground)]">Regler og begrensninger</p>
              <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                Hold reglene praktiske. For fisketilbud bør du beskrive gyldig vann, redskap, fangstgrenser og om nasjonal avgift må betales separat før turen starter.
              </p>
            </div>
            <label className="flex items-center gap-3 text-sm text-[var(--foreground)]">
              <input
                type="checkbox"
                checked={requiresNationalFishingLicense}
                onChange={(event) => setRequiresNationalFishingLicense(event.target.checked)}
                className="h-4 w-4 rounded border-[var(--border)]"
              />
              Nasjonal fiskeravgift eller tilsvarende sentral lisens kreves
            </label>
            <textarea
              value={speciesRestrictions}
              onChange={(event) => setSpeciesRestrictions(event.target.value)}
              rows={3}
              className="w-full rounded-[1.25rem] border border-[var(--border)] bg-white px-4 py-3 text-base outline-none transition focus:border-[var(--amber)]"
              placeholder="Artsbegrensninger eller sesongmessige avgrensninger."
            />
            <textarea
              value={gearRules}
              onChange={(event) => setGearRules(event.target.value)}
              rows={3}
              className="w-full rounded-[1.25rem] border border-[var(--border)] bg-white px-4 py-3 text-base outline-none transition focus:border-[var(--amber)]"
              placeholder="Tillatt redskap, agn, krok eller annet utstyr."
            />
            <textarea
              value={bagLimitNotes}
              onChange={(event) => setBagLimitNotes(event.target.value)}
              rows={3}
              className="w-full rounded-[1.25rem] border border-[var(--border)] bg-white px-4 py-3 text-base outline-none transition focus:border-[var(--amber)]"
              placeholder="Fangstgrenser, dagskvoter eller forventninger til uttak."
            />
            <textarea
              value={areaNotes}
              onChange={(event) => setAreaNotes(event.target.value)}
              rows={3}
              className="w-full rounded-[1.25rem] border border-[var(--border)] bg-white px-4 py-3 text-base outline-none transition focus:border-[var(--amber)]"
              placeholder="Hvordan man holder seg innenfor gyldig område, hvor strekningen starter og slutter, og eventuelle adkomstgrenser."
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <p className="text-sm font-semibold text-[var(--foreground)]">Aktuelle arter</p>
            <div className="flex flex-wrap gap-2">
              {speciesOptions.map((option) => {
                const active = species.includes(option);

                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => toggleSpecies(option)}
                    className={`rounded-full border px-4 py-2 text-sm transition ${
                      active
                        ? "border-[var(--forest)] bg-[var(--forest)] text-white"
                        : "border-[var(--border)] bg-white text-[var(--foreground)]"
                    }`}
                      >
                    {formatSpecies([option])}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-semibold text-[var(--foreground)]" htmlFor="photos">
              Bilder til annonsen
            </label>
            <div className="rounded-[1.5rem] border border-dashed border-[var(--border)] bg-[#fbf8f1] p-5">
              <div className="flex flex-wrap items-center gap-3">
                <input
                  ref={fileInputRef}
                  id="photos"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                  multiple
                  onChange={handlePhotoUpload}
                  className="block text-sm text-[var(--foreground)] file:mr-4 file:rounded-full file:border-0 file:bg-[var(--forest)] file:px-4 file:py-2 file:font-semibold file:text-white"
                />
                <p className="text-sm leading-6 text-[var(--muted)]">
                  Last opp JPG-, PNG-, WebP- eller HEIC-bilder på opptil 8 MB per fil.
                </p>
              </div>
              {isUploadingPhotos ? (
                <p className="mt-3 text-sm text-[var(--muted)]">Laster opp bilder...</p>
              ) : null}
            </div>

            {photos.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {photos.map((photo) => (
                  <div
                    key={photo}
                    className="overflow-hidden rounded-[1.4rem] border border-[var(--border)] bg-white"
                  >
                    <div className="relative aspect-[4/3] bg-[#f1ece1]">
                      <Image
                        src={photo}
                        alt="Bilde til annonse"
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    </div>
                    <div className="space-y-3 p-4">
                      <p className="line-clamp-2 text-xs leading-5 text-[var(--muted)]">{photo}</p>
                      <button
                        type="button"
                        onClick={() => removePhoto(photo)}
                        className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--foreground)]"
                      >
                        Fjern
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm leading-6 text-[var(--muted)]">
                Ingen bilder er lastet opp ennå. Legg til noen tydelige bilder av terreng eller adkomst før du sender annonsen til gjennomgang.
              </p>
            )}
          </div>

          <div className="space-y-3 sm:col-span-2">
            <label className="text-sm font-semibold text-[var(--foreground)]" htmlFor="seasonNotes">
              Sesongnotater
            </label>
            <textarea
              id="seasonNotes"
              value={seasonNotes}
              onChange={(event) => setSeasonNotes(event.target.value)}
              rows={4}
              placeholder="Legg til enkle notater om sesong, lokale forventninger eller tidsbegrensninger."
              className="w-full rounded-[1.5rem] border border-[var(--border)] bg-white px-4 py-3 text-base outline-none transition focus:border-[var(--amber)]"
            />
            <div className="space-y-3 rounded-[1.4rem] border border-[var(--border)] bg-[#fbf8f1] p-4">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-semibold text-[var(--foreground)]">Blokkerte datoer</p>
                <button
                  type="button"
                  onClick={addBlockedRange}
                  className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--foreground)]"
                >
                  Legg til blokkerte datoer
                </button>
              </div>
              {blockedRanges.map((range, index) => (
                <div key={`${index}-${range.startDate}-${range.endDate}`} className="grid gap-3 rounded-2xl border border-[var(--border)] bg-white p-4 sm:grid-cols-[1fr_1fr_1.2fr_auto]">
                  <input
                    type="date"
                    value={range.startDate}
                    onChange={(event) => updateBlockedRange(index, "startDate", event.target.value)}
                    className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm outline-none"
                  />
                  <input
                    type="date"
                    value={range.endDate}
                    onChange={(event) => updateBlockedRange(index, "endDate", event.target.value)}
                    className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm outline-none"
                  />
                  <input
                    type="text"
                    value={range.label ?? ""}
                    onChange={(event) => updateBlockedRange(index, "label", event.target.value)}
                    placeholder="Arsak, for eksempel privat bruk"
                    className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => removeBlockedRange(index)}
                    className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--foreground)]"
                  >
                    Fjern
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {(error || success) && (
          <div
            className={`rounded-2xl px-4 py-3 text-sm ${
              error
                ? "border border-[#e7b0a7] bg-[#fff0ed] text-[#7f3127]"
                : "border border-[#b9d7c7] bg-[#eef8f1] text-[#1f5c3d]"
            }`}
          >
            {error ?? success}
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || isChangingStatus || isUploadingPhotos}
            className="rounded-full bg-[var(--forest)] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSaving ? "Lagrer..." : "Lagre utkast"}
          </button>
          <button
            type="button"
            onClick={() => handleStatusChange("submit_for_review")}
            disabled={isSaving || isChangingStatus || isUploadingPhotos}
            className="rounded-full bg-[var(--amber)] px-5 py-3 text-sm font-semibold text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isChangingStatus ? "Jobber..." : "Send til gjennomgang"}
          </button>
          {currentListing ? (
            <button
              type="button"
              onClick={() => handleStatusChange("archive")}
              disabled={isSaving || isChangingStatus || isUploadingPhotos}
              className="rounded-full border border-[var(--border)] px-5 py-3 text-sm font-semibold text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              Arkiver
            </button>
          ) : null}
        </div>
      </section>

      <aside className="space-y-4">
        <article className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
            Gjeldende status
          </p>
          <p className="mt-3 text-2xl text-[var(--forest)]">
            {currentListing ? formatListingStatus(currentListing.status) : "Ikke opprettet ennå"}
          </p>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
            {currentListing
              ? `${formatListingType(currentListing.type)} · ${formatPricingModel(currentListing.pricingModel)} · ${formatSpecies(currentListing.species)}`
              : "Vi oppretter annonseutkastet sa snart du lagrer."}
          </p>
          {currentListing?.slug ? (
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
              Offentlig URL-nokkel: <span className="font-semibold text-[var(--foreground)]">{currentListing.slug}</span>
            </p>
          ) : null}
          {currentListing ? (
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
              Styring:{" "}
              <span className="font-semibold text-[var(--foreground)]">
                {formatListingGovernanceModel(currentListing.governanceModel)}
              </span>
              {currentListing.coApprovalRequired ? " · Medgodkjenning kreves" : ""}
            </p>
          ) : null}
          {currentListing ? (
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
              Bestillingsflyt:{" "}
              <span className="font-semibold text-[var(--foreground)]">
                {currentListing.instantBookEnabled ? "Direktekjop aktivt" : "Godkjenning forst"}
              </span>
              {" · "}
              {formatCancellationPolicy(currentListing.cancellationPolicy)}
            </p>
          ) : null}
          {currentListing?.quota.summary ? (
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
              Kvote: <span className="font-semibold text-[var(--foreground)]">{currentListing.quota.summary}</span>
            </p>
          ) : null}
          {currentListing?.quota.availabilitySummary ? (
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
              Tilgjengelighet:{" "}
              <span className="font-semibold text-[var(--foreground)]">
                {currentListing.quota.availabilitySummary}
              </span>
            </p>
          ) : null}
          {currentListing?.quota.reportingResponsibility ? (
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
              Rapporteringsansvar:{" "}
              <span className="font-semibold text-[var(--foreground)]">
                {currentListing.quota.reportingResponsibility}
              </span>
            </p>
          ) : null}
        </article>

        <article className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
            Eiendomskontekst
          </p>
          <p className="mt-3 text-lg text-[var(--forest)]">{property.cadastralRef}</p>
          <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
            {property.municipality}, {property.county}
          </p>
          <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
            Grense registrert: {property.hasBoundary ? "Ja" : "Ikke ennå"}
          </p>
          <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
            Tillit: geometri {formatListingConfidence(property.geometryConfidence)} · rettigheter {formatListingConfidence(property.rightsConfidence)} · styring {formatListingConfidence(property.governanceConfidence)}
          </p>
          <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
            Grensenotater: {[
              property.boundaryIsApproximate ? "omtrentlig grense" : null,
              property.rightsDifferFromBoundary ? "rettigheter avviker fra kartet" : null,
            ]
              .filter(Boolean)
              .join(", ") || "ingen spesielle merknader"}
          </p>
          <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
            Valdkontekst: {property.vald ? property.vald.name : "Ingen delt jaktforvaltning koblet til"}
          </p>
        </article>

        <article className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
            Sjekkliste for gjennomgang
          </p>
          <div className="mt-4 space-y-3 text-sm leading-7 text-[var(--foreground)]">
            {checklist.map((item) => (
              <div key={item.label} className="rounded-2xl border border-[var(--border)] px-4 py-3">
                {item.complete ? "Klar" : "Mangler"}: {item.label}
              </div>
            ))}
          </div>
        </article>
      </aside>
    </div>
  );
}
