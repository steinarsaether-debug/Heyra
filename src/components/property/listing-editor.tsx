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
} from "@prisma/client";
import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  formatCancellationPolicy,
  formatListingGovernanceModel,
  formatListingStatus,
  formatListingType,
  formatPricingModel,
  formatSpecies,
  getBigGameGovernanceReadiness,
  isBigGameListing,
} from "@/lib/listing-view";

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
}: {
  property: PropertySummary;
  listing: ListingSummary | null;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(listing?.title ?? `${property.municipality} ${property.cadastralRef}`);
  const [description, setDescription] = useState(
    listing?.description ??
      "Describe the terrain, access conditions, target species, accommodation or facilities, and the kind of experience hunters or fishers should expect.",
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
        ? `This property is part of ${property.vald.name}. Confirm quota, access, and approvals with the vald representative before final confirmation.`
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
      { label: "Boundary captured for this property", complete: property.hasBoundary },
      { label: "Listing title written", complete: title.trim().length >= 6 },
      { label: "Description is detailed enough", complete: description.trim().length >= 40 },
      { label: "At least one species selected", complete: species.length > 0 },
      { label: "At least one photo uploaded", complete: photos.length > 0 },
      {
        label: "Governance context explained for this offer",
        complete: !containsBigGame || governanceNotes.trim().length >= 20,
      },
      {
        label: "Low-confidence boundary or rights context is explained honestly",
        complete:
          !hasTrustWarnings ||
          governanceNotes.toLowerCase().includes("approx") ||
          governanceNotes.toLowerCase().includes("representative") ||
          governanceNotes.toLowerCase().includes("rights"),
      },
      {
        label: "Optional evidence or municipality notes added when governance is less formal",
        complete:
          !property.vald ||
          property.vald.representativeConfirmationStatus === SharedApprovalStatus.CONFIRMED ||
          Boolean(governanceEvidenceNotes.trim() || municipalityProcessNotes.trim()),
      },
      {
        label: "Quota or permit expectations explained",
        complete:
          !containsBigGame ||
          quotaSummary.trim().length >= 8 ||
          permitNotes.trim().length >= 12,
      },
      {
        label: "Quota availability and reporting ownership explained",
        complete:
          !containsBigGame ||
          (availabilitySummary.trim().length >= 8 &&
            reportingResponsibility.trim().length >= 8),
      },
      {
        label: "Rules and area limits explained",
        complete:
          type !== ListingType.FISHING ||
          gearRules.trim().length >= 8 ||
          bagLimitNotes.trim().length >= 8 ||
          areaNotes.trim().length >= 8,
      },
      {
        label: "Public rights layer chosen when the offer area differs from the parcel",
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
      throw new Error(data.error ?? "Unable to create a listing draft.");
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
        throw new Error(data.error ?? "Unable to save the listing.");
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
      setSuccess("Listing draft saved.");
      router.refresh();
      return true;
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save the listing.");
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
        throw new Error("Please fix the listing details before changing its status.");
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
        throw new Error(data.error ?? "Unable to change the listing status.");
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
          ? "Listing submitted for admin review."
          : action === "archive"
            ? "Listing archived."
            : "Listing moved back to draft.",
      );
      router.refresh();
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : "Unable to change listing status.");
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
        throw new Error(data.error ?? "Unable to upload the photos.");
      }

      setPhotos((current) => [...current, ...data.uploads!.map((item) => item.url)]);
      setSuccess(`${data.uploads.length} photo${data.uploads.length === 1 ? "" : "s"} uploaded.`);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Unable to upload the photos.");
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
            Listing editor
          </p>
          <h2 className="mt-3 text-3xl text-[var(--forest)]">
            Turn this property into a public offer.
          </h2>
          <p className="mt-3 max-w-3xl text-base leading-8 text-[var(--muted)]">
            Keep this calm and practical. Write the listing clearly, add a few trustworthy photos, then submit it for review when the basics are in place.
          </p>
        </div>

        {shouldWarnAboutVald ? (
          <div className="rounded-[1.4rem] border border-[#e7d6ae] bg-[#fff8eb] px-5 py-4 text-sm leading-7 text-[#6e5630]">
            Big-game offers often sit inside a shared <span className="font-semibold">vald</span> or hunting area. Make sure the listing explains who can approve access, quota, and dates so hunters are not promised more than one property owner can decide alone.
          </div>
        ) : null}
        {containsBigGame && !governanceReadiness.ready ? (
          <div className="rounded-[1.4rem] border border-[#d8c4a0] bg-[#fff9ef] px-5 py-4 text-sm leading-7 text-[#6b5432]">
            Before review, this big-game listing still needs: {governanceReadiness.issues.join(" ")}
          </div>
        ) : null}
        {hasTrustWarnings ? (
          <div className="rounded-[1.4rem] border border-[#e7d6ae] bg-[#fff8eb] px-5 py-4 text-sm leading-7 text-[#6e5630]">
            This property carries uncertainty in the mapped boundary, the exact rights area, or the shared-governance context. Make that explicit in the listing so hunters understand what is approximate and what still depends on vald or municipal confirmation.
          </div>
        ) : null}

        {currentListing?.reviewerNotes ? (
          <div className="rounded-[1.4rem] border border-[#d8c4a0] bg-[#fff9ef] px-5 py-4 text-sm leading-7 text-[#6b5432]">
            Review note: {currentListing.reviewerNotes}
          </div>
        ) : null}

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-semibold text-[var(--foreground)]" htmlFor="title">
              Public title
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
              Offer type
            </label>
            <select
              id="type"
              value={type}
              onChange={(event) => setType(event.target.value as ListingType)}
              className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-base outline-none transition focus:border-[var(--amber)]"
            >
              {typeOptions.map((option) => (
                <option key={option} value={option}>
                  {formatEnumLabel(option)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-[var(--foreground)]" htmlFor="pricingModel">
              Pricing model
            </label>
            <select
              id="pricingModel"
              value={pricingModel}
              onChange={(event) => setPricingModel(event.target.value as PricingModel)}
              className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-base outline-none transition focus:border-[var(--amber)]"
            >
              {pricingOptions.map((option) => (
                <option key={option} value={option}>
                  {formatEnumLabel(option)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-semibold text-[var(--foreground)]" htmlFor="governanceModel">
              Who controls this offer
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
              Use <span className="font-semibold">Vald managed</span> when quotas, approvals, or access are coordinated across a larger hunting area.
            </p>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-semibold text-[var(--foreground)]" htmlFor="description">
              Public description
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
              Price in NOK
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
              Max group size
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
              Minimum nights
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
              <p className="text-sm font-semibold text-[var(--foreground)]">Checkout and cancellation</p>
              <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                Choose whether this offer can be purchased instantly and how cancellations should be handled after payment is authorized.
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
                ? "Allow instant fishing licence checkout"
                : "Allow direct confirmation after contract and payment"}
            </label>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[var(--foreground)]" htmlFor="cancellationPolicy">
                Cancellation policy
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
              <p className="text-sm font-semibold text-[var(--foreground)]">Approval and governance notes</p>
              <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                Explain who makes the final access decision, whether this area sits inside a vald, and what the hunter should expect about permits or co-approval.
              </p>
            </div>
            {property.vald ? (
              <div className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm leading-7 text-[var(--foreground)]">
                Connected vald: <span className="font-semibold">{property.vald.name}</span> in {property.vald.municipality}, {property.vald.county}. Representative: {property.vald.representativeName}.
                {property.vald.localReference ? ` Reference: ${property.vald.localReference}.` : ""}
                {` Verification: ${property.vald.verificationMethod.replaceAll("_", " ").toLowerCase()}.`}
                {` Representative status: ${property.vald.representativeConfirmationStatus.replaceAll("_", " ").toLowerCase()}.`}
              </div>
            ) : null}
            <label className="flex items-center gap-3 text-sm text-[var(--foreground)]">
              <input
                type="checkbox"
                checked={coApprovalRequired}
                onChange={(event) => setCoApprovalRequired(event.target.checked)}
                className="h-4 w-4 rounded border-[var(--border)]"
              />
              This offer requires co-approval before dates or quotas are final
            </label>
            {property.rightsOverlays.length > 0 ? (
              <div className="space-y-2 rounded-2xl border border-[var(--border)] bg-white px-4 py-4">
                <label
                  className="text-sm font-semibold text-[var(--foreground)]"
                  htmlFor="publicRightsOverlayId"
                >
                  Public map area
                </label>
                <select
                  id="publicRightsOverlayId"
                  value={publicRightsOverlayId}
                  onChange={(event) => setPublicRightsOverlayId(event.target.value)}
                  className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-base outline-none transition focus:border-[var(--amber)]"
                >
                  <option value="">Use parcel boundary publicly</option>
                  {property.rightsOverlays.map((overlay) => (
                    <option key={overlay.id} value={overlay.id}>
                      {overlay.title} · {formatEnumLabel(overlay.overlayType)}
                    </option>
                  ))}
                </select>
                <p className="text-sm leading-6 text-[var(--muted)]">
                  Choose a public rights layer when the area you rent out is narrower than the
                  cadastral parcel. Leave this on parcel boundary if the public map can safely show
                  the whole property outline.
                </p>
              </div>
            ) : null}
            <textarea
              value={governanceNotes}
              onChange={(event) => setGovernanceNotes(event.target.value)}
              rows={4}
              className="w-full rounded-[1.25rem] border border-[var(--border)] bg-white px-4 py-3 text-base outline-none transition focus:border-[var(--amber)]"
              placeholder="Example: This parcel is part of a shared vald. Final approval is confirmed with the vald representative after reviewing quota and neighboring hunt plans."
            />
            <textarea
              value={governanceEvidenceNotes}
              onChange={(event) => setGovernanceEvidenceNotes(event.target.value)}
              rows={3}
              className="w-full rounded-[1.25rem] border border-[var(--border)] bg-white px-4 py-3 text-base outline-none transition focus:border-[var(--amber)]"
              placeholder="Optional: note documents, calls, meeting notes, or local evidence that supports the shared-governance setup."
            />
            <textarea
              value={municipalityProcessNotes}
              onChange={(event) => setMunicipalityProcessNotes(event.target.value)}
              rows={3}
              className="w-full rounded-[1.25rem] border border-[var(--border)] bg-white px-4 py-3 text-base outline-none transition focus:border-[var(--amber)]"
              placeholder="Optional: explain if this area is still handled through municipal paper/PDF/manual routines rather than a tidy digital process."
            />
          </div>

          <div className="space-y-3 sm:col-span-2 rounded-[1.5rem] border border-[var(--border)] bg-[#fbf8f1] p-5">
            <div>
              <p className="text-sm font-semibold text-[var(--foreground)]">Quota and permit guidance</p>
              <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                Especially for big-game offers, explain what is actually included, what is still available inside the shared quota, and who carries the reporting responsibility after the trip.
              </p>
            </div>
            <textarea
              value={quotaSummary}
              onChange={(event) => setQuotaSummary(event.target.value)}
              rows={3}
              className="w-full rounded-[1.25rem] border border-[var(--border)] bg-white px-4 py-3 text-base outline-none transition focus:border-[var(--amber)]"
              placeholder="Example: One adult elk slot may be available within the shared quota, pending final vald allocation."
            />
            <textarea
              value={availabilitySummary}
              onChange={(event) => setAvailabilitySummary(event.target.value)}
              rows={3}
              className="w-full rounded-[1.25rem] border border-[var(--border)] bg-white px-4 py-3 text-base outline-none transition focus:border-[var(--amber)]"
              placeholder="Example: Two calf slots remain realistic at the moment, but adult allocation is still being checked with the vald."
            />
            <textarea
              value={permitNotes}
              onChange={(event) => setPermitNotes(event.target.value)}
              rows={3}
              className="w-full rounded-[1.25rem] border border-[var(--border)] bg-white px-4 py-3 text-base outline-none transition focus:border-[var(--amber)]"
              placeholder="Example: Jegeravgift must be valid, and final local permit allocation is confirmed with the vald before the hunt starts."
            />
            <textarea
              value={reportingNotes}
              onChange={(event) => setReportingNotes(event.target.value)}
              rows={3}
              className="w-full rounded-[1.25rem] border border-[var(--border)] bg-white px-4 py-3 text-base outline-none transition focus:border-[var(--amber)]"
              placeholder="Example: Harvest and observation reporting must be sent back the same day after the hunt."
            />
            <textarea
              value={reportingResponsibility}
              onChange={(event) => setReportingResponsibility(event.target.value)}
              rows={3}
              className="w-full rounded-[1.25rem] border border-[var(--border)] bg-white px-4 py-3 text-base outline-none transition focus:border-[var(--amber)]"
              placeholder="Example: The hunter reports the harvest to the landowner the same day, and the vald representative files the official follow-up."
            />
          </div>

          <div className="space-y-3 sm:col-span-2 rounded-[1.5rem] border border-[var(--border)] bg-[#fbf8f1] p-5">
            <div>
              <p className="text-sm font-semibold text-[var(--foreground)]">Rules and limitations</p>
              <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                Keep the rules practical. For fishing offers, spell out valid water, gear, take limits, and whether a national fee must be paid separately before the trip starts.
              </p>
            </div>
            <label className="flex items-center gap-3 text-sm text-[var(--foreground)]">
              <input
                type="checkbox"
                checked={requiresNationalFishingLicense}
                onChange={(event) => setRequiresNationalFishingLicense(event.target.checked)}
                className="h-4 w-4 rounded border-[var(--border)]"
              />
              National fishing fee or similar central licence is required
            </label>
            <textarea
              value={speciesRestrictions}
              onChange={(event) => setSpeciesRestrictions(event.target.value)}
              rows={3}
              className="w-full rounded-[1.25rem] border border-[var(--border)] bg-white px-4 py-3 text-base outline-none transition focus:border-[var(--amber)]"
              placeholder="Species restrictions or seasonal limitations."
            />
            <textarea
              value={gearRules}
              onChange={(event) => setGearRules(event.target.value)}
              rows={3}
              className="w-full rounded-[1.25rem] border border-[var(--border)] bg-white px-4 py-3 text-base outline-none transition focus:border-[var(--amber)]"
              placeholder="Allowed gear, bait, hook, or equipment rules."
            />
            <textarea
              value={bagLimitNotes}
              onChange={(event) => setBagLimitNotes(event.target.value)}
              rows={3}
              className="w-full rounded-[1.25rem] border border-[var(--border)] bg-white px-4 py-3 text-base outline-none transition focus:border-[var(--amber)]"
              placeholder="Bag limits, daily take limits, or harvest expectations."
            />
            <textarea
              value={areaNotes}
              onChange={(event) => setAreaNotes(event.target.value)}
              rows={3}
              className="w-full rounded-[1.25rem] border border-[var(--border)] bg-white px-4 py-3 text-base outline-none transition focus:border-[var(--amber)]"
              placeholder="How to stay inside the valid area, where the stretch starts and ends, and any access boundaries."
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <p className="text-sm font-semibold text-[var(--foreground)]">Target species</p>
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
                    {formatEnumLabel(option)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-semibold text-[var(--foreground)]" htmlFor="photos">
              Listing photos
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
                  Upload JPG, PNG, WebP, or HEIC images up to 8 MB each.
                </p>
              </div>
              {isUploadingPhotos ? (
                <p className="mt-3 text-sm text-[var(--muted)]">Uploading photos...</p>
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
                        alt="Listing photo"
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
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm leading-6 text-[var(--muted)]">
                No photos uploaded yet. Add a few clear terrain or access photos before sending the listing for review.
              </p>
            )}
          </div>

          <div className="space-y-3 sm:col-span-2">
            <label className="text-sm font-semibold text-[var(--foreground)]" htmlFor="seasonNotes">
              Season notes
            </label>
            <textarea
              id="seasonNotes"
              value={seasonNotes}
              onChange={(event) => setSeasonNotes(event.target.value)}
              rows={4}
              placeholder="Add simple notes about the open season, local expectations, or timing constraints."
              className="w-full rounded-[1.5rem] border border-[var(--border)] bg-white px-4 py-3 text-base outline-none transition focus:border-[var(--amber)]"
            />
            <div className="space-y-3 rounded-[1.4rem] border border-[var(--border)] bg-[#fbf8f1] p-4">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-semibold text-[var(--foreground)]">Blocked date ranges</p>
                <button
                  type="button"
                  onClick={addBlockedRange}
                  className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--foreground)]"
                >
                  Add blocked dates
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
                    placeholder="Reason, for example family use"
                    className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => removeBlockedRange(index)}
                    className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--foreground)]"
                  >
                    Remove
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
            {isSaving ? "Saving..." : "Save draft"}
          </button>
          <button
            type="button"
            onClick={() => handleStatusChange("submit_for_review")}
            disabled={isSaving || isChangingStatus || isUploadingPhotos}
            className="rounded-full bg-[var(--amber)] px-5 py-3 text-sm font-semibold text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isChangingStatus ? "Working..." : "Submit for review"}
          </button>
          {currentListing ? (
            <button
              type="button"
              onClick={() => handleStatusChange("archive")}
              disabled={isSaving || isChangingStatus || isUploadingPhotos}
              className="rounded-full border border-[var(--border)] px-5 py-3 text-sm font-semibold text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              Archive
            </button>
          ) : null}
        </div>
      </section>

      <aside className="space-y-4">
        <article className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
            Current status
          </p>
          <p className="mt-3 text-2xl text-[var(--forest)]">
            {currentListing ? formatListingStatus(currentListing.status) : "Not created yet"}
          </p>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
            {currentListing
              ? `${formatListingType(currentListing.type)} · ${formatPricingModel(currentListing.pricingModel)} · ${formatSpecies(currentListing.species)}`
              : "We will create the listing draft as soon as you save it."}
          </p>
          {currentListing?.slug ? (
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
              Public URL key: <span className="font-semibold text-[var(--foreground)]">{currentListing.slug}</span>
            </p>
          ) : null}
          {currentListing ? (
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
              Governance:{" "}
              <span className="font-semibold text-[var(--foreground)]">
                {formatListingGovernanceModel(currentListing.governanceModel)}
              </span>
              {currentListing.coApprovalRequired ? " · Co-approval required" : ""}
            </p>
          ) : null}
          {currentListing ? (
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
              Checkout:{" "}
              <span className="font-semibold text-[var(--foreground)]">
                {currentListing.instantBookEnabled ? "Instant enabled" : "Approval-first"}
              </span>
              {" · "}
              {formatCancellationPolicy(currentListing.cancellationPolicy)}
            </p>
          ) : null}
          {currentListing?.quota.summary ? (
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
              Quota: <span className="font-semibold text-[var(--foreground)]">{currentListing.quota.summary}</span>
            </p>
          ) : null}
          {currentListing?.quota.availabilitySummary ? (
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
              Availability:{" "}
              <span className="font-semibold text-[var(--foreground)]">
                {currentListing.quota.availabilitySummary}
              </span>
            </p>
          ) : null}
          {currentListing?.quota.reportingResponsibility ? (
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
              Reporting owner:{" "}
              <span className="font-semibold text-[var(--foreground)]">
                {currentListing.quota.reportingResponsibility}
              </span>
            </p>
          ) : null}
        </article>

        <article className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
            Property context
          </p>
          <p className="mt-3 text-lg text-[var(--forest)]">{property.cadastralRef}</p>
          <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
            {property.municipality}, {property.county}
          </p>
          <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
            Boundary captured: {property.hasBoundary ? "Yes" : "Not yet"}
          </p>
          <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
            Confidence: geometry {property.geometryConfidence.toLowerCase()} · rights {property.rightsConfidence.toLowerCase()} · governance {property.governanceConfidence.toLowerCase()}
          </p>
          <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
            Boundary notes: {[
              property.boundaryIsApproximate ? "approximate boundary" : null,
              property.rightsDifferFromBoundary ? "rights differ from map" : null,
            ]
              .filter(Boolean)
              .join(", ") || "no special warning"}
          </p>
          <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
            Vald context: {property.vald ? property.vald.name : "No shared hunting area attached"}
          </p>
        </article>

        <article className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
            Review checklist
          </p>
          <div className="mt-4 space-y-3 text-sm leading-7 text-[var(--foreground)]">
            {checklist.map((item) => (
              <div key={item.label} className="rounded-2xl border border-[var(--border)] px-4 py-3">
                {item.complete ? "Complete" : "Needed"}: {item.label}
              </div>
            ))}
          </div>
        </article>
      </aside>
    </div>
  );
}
