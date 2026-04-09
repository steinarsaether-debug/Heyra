import {
  ConfidenceLevel,
  CancellationPolicy,
  ListingGovernanceModel,
  ListingStatus,
  ListingType,
  PricingModel,
  Species,
  type Listing,
  type Property,
} from "@prisma/client";
import type { AppLocale } from "@/lib/i18n/config";

export type ListingEditorRecord = Listing & {
  property: Pick<Property, "id" | "cadastralRef" | "municipality" | "county" | "status">;
};

const localeGroup = (locale: AppLocale) => (locale === "en" ? "en" : "nb");

const listingStatusLabels = {
  nb: {
    DRAFT: "Utkast",
    PENDING_REVIEW: "Til gjennomgang",
    PUBLISHED: "Publisert",
    ARCHIVED: "Arkivert",
  },
  en: {
    DRAFT: "Draft",
    PENDING_REVIEW: "Pending review",
    PUBLISHED: "Published",
    ARCHIVED: "Archived",
  },
} satisfies Record<"nb" | "en", Record<ListingStatus, string>>;

const listingTypeLabels = {
  nb: {
    HUNTING: "Jakt",
    FISHING: "Fiske",
  },
  en: {
    HUNTING: "Hunting",
    FISHING: "Fishing",
  },
} satisfies Record<"nb" | "en", Record<ListingType, string>>;

const governanceLabels = {
  nb: {
    INDIVIDUAL_PROPERTY: "Enkeltstående eiendom",
    VALD_MANAGED: "Vald-styrt",
  },
  en: {
    INDIVIDUAL_PROPERTY: "Individual property",
    VALD_MANAGED: "Vald-managed",
  },
} satisfies Record<"nb" | "en", Record<ListingGovernanceModel, string>>;

const pricingLabels = {
  nb: {
    PER_DAY: "Per dag",
    PER_SEASON: "Per sesong",
    PER_ANIMAL: "Per dyr",
  },
  en: {
    PER_DAY: "Per day",
    PER_SEASON: "Per season",
    PER_ANIMAL: "Per animal",
  },
} satisfies Record<"nb" | "en", Record<PricingModel, string>>;

const cancellationLabels = {
  nb: {
    FLEXIBLE: "Fleksibel",
    MODERATE: "Moderat",
    STRICT: "Streng",
  },
  en: {
    FLEXIBLE: "Flexible",
    MODERATE: "Moderate",
    STRICT: "Strict",
  },
} satisfies Record<"nb" | "en", Record<CancellationPolicy, string>>;

const speciesLabels = {
  nb: {
    ELG: "Elg",
    HJORT: "Hjort",
    RADYR: "Rådyr",
    VILLREIN: "Villrein",
    REV: "Rev",
    RYPE: "Rype",
    HARE: "Hare",
    AND: "And",
    LAKS: "Laks",
    SJOOERRET: "Sjøørret",
    ROYE: "Røye",
    OERRET: "Ørret",
    ABBOR: "Abbor",
    GJEDDE: "Gjedde",
  },
  en: {
    ELG: "Moose",
    HJORT: "Red deer",
    RADYR: "Deer",
    VILLREIN: "Wild reindeer",
    REV: "Fox",
    RYPE: "Grouse",
    HARE: "Hare",
    AND: "Duck",
    LAKS: "Salmon",
    SJOOERRET: "Sea trout",
    ROYE: "Arctic char",
    OERRET: "Trout",
    ABBOR: "Perch",
    GJEDDE: "Pike",
  },
} satisfies Record<"nb" | "en", Record<Species, string>>;

export function formatListingStatus(status: ListingStatus, locale: AppLocale = "nb") {
  return listingStatusLabels[localeGroup(locale)][status];
}

export function formatListingType(type: ListingType, locale: AppLocale = "nb") {
  return listingTypeLabels[localeGroup(locale)][type];
}

export function formatListingGovernanceModel(model: ListingGovernanceModel, locale: AppLocale = "nb") {
  return governanceLabels[localeGroup(locale)][model];
}

export function formatPricingModel(model: PricingModel, locale: AppLocale = "nb") {
  return pricingLabels[localeGroup(locale)][model];
}

export function formatCancellationPolicy(policy: CancellationPolicy, locale: AppLocale = "nb") {
  return cancellationLabels[localeGroup(locale)][policy];
}

export function formatSpecies(species: Species[], locale: AppLocale = "nb") {
  if (species.length === 0) {
    return localeGroup(locale) === "en" ? "Not set" : "Ikke satt";
  }

  return species.map((item) => speciesLabels[localeGroup(locale)][item]).join(", ");
}

export function getListingChecklist(listing: Pick<Listing, "title" | "description" | "species" | "photos" | "priceNok"> | null) {
  const steps = [
    {
      key: "title",
      label: "Tydelig annonsetittel",
      complete: Boolean(listing?.title.trim()),
    },
    {
      key: "description",
      label: "Hjelpsom offentlig beskrivelse",
      complete: Boolean(listing?.description.trim()),
    },
    {
      key: "species",
      label: "Målart er valgt",
      complete: Boolean(listing?.species.length),
    },
    {
      key: "pricing",
      label: "Offentlig pris er satt",
      complete: Boolean(listing && listing.priceNok > 0),
    },
    {
      key: "photos",
      label: "Minst ett bilde er lagt inn",
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

export function formatListingConfidence(level: ConfidenceLevel) {
  switch (level) {
    case ConfidenceLevel.LOW:
      return "lav";
    case ConfidenceLevel.MEDIUM:
      return "middels";
    case ConfidenceLevel.HIGH:
      return "høy";
  }
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
