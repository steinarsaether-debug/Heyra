import type { ListingType, PricingModel, ServiceCategory, Species } from "@prisma/client";
import { absoluteUrl, SITE_NAME } from "@/lib/site";
import { formatListingType, formatPricingModel, formatSpecies } from "@/lib/listing-view";
import { formatServiceCategory } from "@/lib/service-view";

export function buildListingMetadataDescription(input: {
  title: string;
  municipality: string;
  county: string;
  type: ListingType;
  species: Species[];
  priceNok: number;
  locale?: "nb" | "en";
}) {
  const locale = input.locale ?? "nb";
  return locale === "en"
    ? `${input.title} in ${input.municipality}, ${input.county}. ${formatListingType(input.type, "en")} for ${formatSpecies(input.species, "en")} from NOK ${input.priceNok.toLocaleString("nb-NO")}.`
    : `${input.title} i ${input.municipality}, ${input.county}. ${formatListingType(input.type, "nb")} for ${formatSpecies(input.species, "nb")} fra kr ${input.priceNok.toLocaleString("nb-NO")}.`;
}

export function buildListingJsonLd(input: {
  title: string;
  description: string;
  slug: string;
  municipality: string;
  county: string;
  type: ListingType;
  species: Species[];
  pricingModel: PricingModel;
  priceNok: number;
  photos: string[];
  locale?: "nb" | "en";
}) {
  const locale = input.locale ?? "nb";
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.title,
    description: input.description,
    category: `${formatListingType(input.type, locale)}: ${formatSpecies(input.species, locale)}`,
    image: input.photos.map((photo) => absoluteUrl(photo)),
    brand: {
      "@type": "Brand",
      name: SITE_NAME,
    },
    offers: {
      "@type": "Offer",
      priceCurrency: "NOK",
      price: input.priceNok.toFixed(2),
      availability: "https://schema.org/InStock",
      url: absoluteUrl(`/listings/${input.slug}`),
      itemCondition: "https://schema.org/NewCondition",
      eligibleRegion: {
        "@type": "Country",
        name: "Norway",
      },
      areaServed: `${input.municipality}, ${input.county}`,
      category: formatPricingModel(input.pricingModel, locale),
    },
  };
}

export function buildListingSocialImageUrl(slug: string) {
  return absoluteUrl(`/listings/${slug}/opengraph-image`);
}

export function buildServiceMetadataDescription(input: {
  title: string;
  municipality: string;
  county: string;
  category: ServiceCategory;
  businessName: string;
}) {
  return `${input.title} in ${input.municipality}, ${input.county}. ${formatServiceCategory(input.category)} from ${input.businessName}.`;
}

export function buildServiceJsonLd(input: {
  slug: string;
  title: string;
  description: string;
  category: ServiceCategory;
  businessName: string;
  municipality: string;
  county: string;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  priceFromNok?: number | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: input.businessName,
    description: input.description,
    url: absoluteUrl(`/services/${input.slug}`),
    areaServed: `${input.municipality}, ${input.county}`,
    makesOffer: {
      "@type": "Offer",
      name: input.title,
      category: formatServiceCategory(input.category),
      priceCurrency: "NOK",
      ...(input.priceFromNok ? { price: input.priceFromNok.toFixed(2) } : {}),
    },
    ...(input.phone ? { telephone: input.phone } : {}),
    ...(input.email ? { email: input.email } : {}),
    ...(input.website ? { sameAs: input.website } : {}),
    brand: {
      "@type": "Brand",
      name: SITE_NAME,
    },
  };
}
