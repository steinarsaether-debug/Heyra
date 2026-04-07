import {
  CancellationPolicy,
  ListingGovernanceModel,
  ListingStatus,
  ListingType,
  PricingModel,
  Species,
  type Listing,
  type Property,
} from "@prisma/client";

export type ListingEditorRecord = Listing & {
  property: Pick<Property, "id" | "cadastralRef" | "municipality" | "county" | "status">;
};

export function formatListingStatus(status: ListingStatus) {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatListingType(type: ListingType) {
  return type.charAt(0) + type.slice(1).toLowerCase();
}

export function formatListingGovernanceModel(model: ListingGovernanceModel) {
  return model
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatPricingModel(model: PricingModel) {
  return model
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatCancellationPolicy(policy: CancellationPolicy) {
  return policy.charAt(0) + policy.slice(1).toLowerCase();
}

export function formatSpecies(species: Species[]) {
  if (species.length === 0) {
    return "Not set";
  }

  return species
    .map((item) => item.toLowerCase())
    .map((item) => item.charAt(0).toUpperCase() + item.slice(1))
    .join(", ");
}

export function getListingChecklist(listing: Pick<Listing, "title" | "description" | "species" | "photos" | "priceNok"> | null) {
  const steps = [
    {
      key: "title",
      label: "Clear listing title",
      complete: Boolean(listing?.title.trim()),
    },
    {
      key: "description",
      label: "Helpful public description",
      complete: Boolean(listing?.description.trim()),
    },
    {
      key: "species",
      label: "Target species selected",
      complete: Boolean(listing?.species.length),
    },
    {
      key: "pricing",
      label: "Public price set",
      complete: Boolean(listing && listing.priceNok > 0),
    },
    {
      key: "photos",
      label: "At least one photo URL added",
      complete: Boolean(listing?.photos.length),
    },
  ];

  const completed = steps.filter((step) => step.complete).length;

  return {
    steps,
    completed,
    total: steps.length,
    percent: Math.round((completed / steps.length) * 100),
  };
}

export function buildListingSlug(title: string, fallbackId?: string) {
  const base = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 70);

  if (base.length > 0) {
    return base;
  }

  return fallbackId ? `listing-${fallbackId.toLowerCase()}` : "listing";
}

const bigGameSpecies = new Set<Species>([
  Species.ELG,
  Species.HJORT,
  Species.RADYR,
  Species.VILLREIN,
]);

export function isBigGameListing(species: Species[]) {
  return species.some((item) => bigGameSpecies.has(item));
}

export function getBigGameGovernanceReadiness(input: {
  governanceNotes: string | null | undefined;
  quota: {
    summary?: string;
    availabilitySummary?: string;
    permitNotes?: string;
    reportingNotes?: string;
    reportingResponsibility?: string;
  } | null | undefined;
  governanceModel: ListingGovernanceModel;
  hasVald: boolean;
}) {
  const quota = input.quota ?? {};
  const issues: string[] = [];

  if ((input.governanceNotes ?? "").trim().length < 20) {
    issues.push("Explain who approves access, dates, and quota.");
  }

  if (!(quota.summary ?? "").trim() && !(quota.permitNotes ?? "").trim()) {
    issues.push("Add quota or permit guidance.");
  }

  if (!(quota.availabilitySummary ?? "").trim()) {
    issues.push("Explain what quota is actually still available.");
  }

  if (!(quota.reportingResponsibility ?? "").trim()) {
    issues.push("State who is responsible for harvest reporting.");
  }

  if (input.hasVald && input.governanceModel !== ListingGovernanceModel.VALD_MANAGED) {
    issues.push("Use vald-managed governance for properties that belong to a vald.");
  }

  return {
    ready: issues.length === 0,
    issues,
  };
}
