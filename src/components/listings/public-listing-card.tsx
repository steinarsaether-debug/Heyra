import Image from "next/image";
import Link from "next/link";
import { TrustBadge } from "@/components/trust/trust-badge";
import type { AppLocale } from "@/lib/i18n/config";
import type { ListingSearchResult } from "@/lib/listing-search";
import { formatListingType, formatPricingModel, formatSpecies } from "@/lib/listing-view";

export function PublicListingCard({
  listing,
  locale,
  distanceLabel,
  speciesLabel,
  pricingLabel,
  availabilityLabel,
  trustLabel,
  openLabel,
  ctaLabel,
  variant = "default",
}: {
  listing: ListingSearchResult;
  locale: AppLocale;
  distanceLabel: (distance: number) => string;
  speciesLabel: string;
  pricingLabel: string;
  availabilityLabel: string;
  trustLabel: string;
  openLabel: string;
  ctaLabel: string;
  variant?: "default" | "featured";
}) {
  if (variant === "featured") {
    return (
      <Link
        href={`/listings/${listing.slug}`}
        className="group relative min-h-[26rem] overflow-hidden rounded-[1.9rem] bg-[#102019] text-white shadow-[0_22px_55px_rgba(16,42,33,0.12)] transition hover:-translate-y-1"
      >
        {listing.leadPhoto ? (
          <div
            className="absolute inset-0 transition duration-500 group-hover:scale-[1.04]"
            style={{
              backgroundImage: `linear-gradient(180deg, rgba(7,18,14,0.1) 0%, rgba(7,18,14,0.72) 72%, rgba(7,18,14,0.94) 100%), url(${listing.leadPhoto})`,
              backgroundPosition: "center",
              backgroundSize: "cover",
            }}
          />
        ) : (
          <div className="absolute inset-0 bg-[linear-gradient(180deg,#274d3f,#112118)]" />
        )}
        <div className="relative flex h-full flex-col justify-end p-6">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-white/16 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/78 backdrop-blur-sm">
              {formatListingType(listing.type, locale)}
            </span>
            {listing.distanceKm !== null ? (
              <span className="rounded-full border border-white/16 bg-white/10 px-3 py-1 text-xs font-semibold text-white/78 backdrop-blur-sm">
                {distanceLabel(listing.distanceKm)}
              </span>
            ) : null}
          </div>
          <h3 className="mt-4 text-2xl font-semibold leading-tight text-white">
            {listing.title}
          </h3>
          <p className="mt-2 text-sm text-white/72">
            {listing.municipality}, {listing.county}
          </p>
          <p className="mt-3 line-clamp-3 text-sm leading-7 text-white/78">
            {listing.description}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="rounded-full bg-white/12 px-3 py-1 text-xs font-semibold text-white/84 backdrop-blur-sm">
              {formatSpecies(listing.species, locale)}
            </span>
            <span className="rounded-full bg-white/12 px-3 py-1 text-xs font-semibold text-white/84 backdrop-blur-sm">
              {formatPricingModel(listing.pricingModel, locale)} · NOK {listing.priceNok.toLocaleString("nb-NO")}
            </span>
          </div>
          {listing.hostBadgeLabel ? (
            <div className="mt-5">
              <TrustBadge
                compact
                label={listing.hostBadgeLabel}
                detail={listing.trustDetail}
                tone={listing.hostBadgeTone ?? "amber"}
              />
            </div>
          ) : null}
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/listings/${listing.slug}`}
      className="group overflow-hidden rounded-[1.7rem] border border-[rgba(16,42,33,0.08)] bg-[rgba(255,255,255,0.9)] shadow-[0_16px_40px_rgba(16,42,33,0.05)] transition hover:-translate-y-1 hover:bg-white"
    >
      {listing.leadPhoto ? (
        <div className="relative h-56 overflow-hidden border-b border-[rgba(16,42,33,0.08)]">
          <Image
            src={listing.leadPhoto}
            alt={listing.title}
            width={900}
            height={560}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
          <div className="absolute inset-x-0 bottom-0 h-28 bg-[linear-gradient(180deg,transparent,rgba(7,18,14,0.58))]" />
          <div className="absolute left-5 top-5 flex flex-wrap gap-2">
            <span className="rounded-full border border-white/16 bg-white/12 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white backdrop-blur-sm">
              {formatListingType(listing.type, locale)}
            </span>
            {listing.distanceKm !== null ? (
              <span className="rounded-full border border-white/16 bg-white/12 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                {distanceLabel(listing.distanceKm)}
              </span>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="h-40 bg-[linear-gradient(135deg,#274d3f,#112118)]" />
      )}
      <div className="p-6">
        <h2 className="text-2xl text-[var(--forest)]">{listing.title}</h2>
        <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
          {listing.municipality}, {listing.county}
        </p>
        <p className="mt-3 text-sm leading-7 text-[var(--foreground)] line-clamp-3">
          {listing.description}
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-[1rem] bg-[rgba(239,232,219,0.46)] px-4 py-3 text-sm">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
              {speciesLabel}
            </p>
            <p className="mt-2 font-medium text-[var(--foreground)]">
              {formatSpecies(listing.species, locale)}
            </p>
          </div>
          <div className="rounded-[1rem] bg-[rgba(239,232,219,0.46)] px-4 py-3 text-sm">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
              {pricingLabel}
            </p>
            <p className="mt-2 font-medium text-[var(--foreground)]">
              {formatPricingModel(listing.pricingModel, locale)} · NOK{" "}
              {listing.priceNok.toLocaleString("nb-NO")}
            </p>
          </div>
          <div className="rounded-[1rem] bg-[rgba(239,232,219,0.46)] px-4 py-3 text-sm">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
              {availabilityLabel}
            </p>
            <p className="mt-2 font-medium text-[var(--foreground)]">
              {listing.availabilityLabel}
            </p>
          </div>
          <div className="rounded-[1rem] bg-[rgba(239,232,219,0.46)] px-4 py-3 text-sm">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
              {trustLabel}
            </p>
            <p className="mt-2 font-medium text-[var(--foreground)]">
              {listing.trustLabel}
            </p>
          </div>
        </div>
        <div className="mt-5 flex items-center justify-between gap-4">
          {listing.hostBadgeLabel ? (
            <TrustBadge
              compact
              label={listing.hostBadgeLabel}
              detail={listing.trustDetail}
              tone={listing.hostBadgeTone ?? "amber"}
            />
          ) : (
            <span className="text-sm text-[var(--muted)]">{openLabel}</span>
          )}
          <span className="rounded-full bg-[var(--forest)] px-4 py-2 text-sm font-semibold text-white transition group-hover:bg-[var(--forest-soft)]">
            {ctaLabel}
          </span>
        </div>
      </div>
    </Link>
  );
}
