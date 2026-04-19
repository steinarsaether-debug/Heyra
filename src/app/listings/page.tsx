import type { Metadata } from "next";
import { ListingType, Species } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { NearbySearchButton } from "@/components/listings/nearby-search-button";
import { ListingsSearchMap } from "@/components/listings/listings-search-map";
import { OfflinePageNote } from "@/components/pwa/offline-page-note";
import { TrustBadge } from "@/components/trust/trust-badge";
import { getMessages } from "@/lib/i18n/messages";
import { getRequestLocale } from "@/lib/i18n/request";
import { createTranslator } from "@/lib/i18n/translate";
import {
  buildListingSearchQueryString,
  parseListingSearchParams,
  searchPublishedListings,
} from "@/lib/listing-search";
import { formatListingType, formatPricingModel, formatSpecies } from "@/lib/listing-view";
import { prisma } from "@/lib/prisma";
import { absoluteUrl } from "@/lib/site";

type ListingsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export const revalidate = 300;

export async function generateMetadata({
  searchParams,
}: ListingsPageProps): Promise<Metadata> {
  const locale = await getRequestLocale();
  const messages = getMessages(locale);
  const t = createTranslator(locale, messages);
  const rawParams = searchParams ? await searchParams : {};
  const params = parseListingSearchParams(rawParams);
  const hasFilters = Boolean(
    params.q ||
      params.type ||
      params.species ||
      params.municipality ||
      params.minPrice !== null ||
      params.maxPrice !== null ||
      params.availability !== "all" ||
      params.nearLat !== null ||
      params.nearLng !== null ||
      params.north !== null,
  );

  return {
    title: hasFilters ? t("listings.metadataFilteredTitle") : t("listings.metadataTitle"),
    description: hasFilters
      ? t("listings.metadataFilteredDescription")
      : t("listings.metadataDescription"),
    alternates: {
      canonical: absoluteUrl("/listings"),
    },
    robots: hasFilters
      ? {
          index: false,
          follow: true,
        }
      : undefined,
  };
}

export default async function ListingsPage({ searchParams }: ListingsPageProps) {
  const locale = await getRequestLocale();
  const messages = getMessages(locale);
  const t = createTranslator(locale, messages);
  const rawParams = searchParams ? await searchParams : {};
  const params = parseListingSearchParams(rawParams);
  const listings = await searchPublishedListings(prisma, params);
  const activeQuery = buildListingSearchQueryString(params);
  const featuredListings = listings.slice(0, 3);
  const showMap = params.view === "map";

  return (
    <main className="px-4 py-5 sm:px-6 sm:py-6 md:px-8">
      <section className="space-y-8">
        <div className="overflow-hidden rounded-[2rem] border border-[rgba(16,42,33,0.1)] bg-[rgba(255,251,245,0.9)] shadow-[0_24px_80px_rgba(16,42,33,0.08)] backdrop-blur-sm">
          <div className="heyra-discovery-hero border-b border-[rgba(16,42,33,0.08)] px-5 py-8 sm:px-8 sm:py-10 lg:px-10">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <div className="max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--orange)]">
                  {t("listings.eyebrow")}
                </p>
                <h1 className="mt-3 text-4xl leading-tight text-[var(--forest)] sm:text-5xl">
                  {t("listings.title")}
                </h1>
                <p className="mt-4 max-w-2xl text-lg leading-8 text-[var(--muted)]">
                  {t("listings.body")}
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <NearbySearchButton />
                  <Link
                    href="/listings/fishing/nearby"
                    className="rounded-full border border-[rgba(16,42,33,0.12)] bg-white/82 px-5 py-3 text-sm font-semibold text-[var(--foreground)] shadow-[0_10px_24px_rgba(16,42,33,0.05)]"
                  >
                    {t("listings.nearbyFishingView")}
                  </Link>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/listings${activeQuery ? `?${activeQuery}` : ""}`}
                  className={`rounded-full px-5 py-3 text-sm font-semibold shadow-[0_8px_24px_rgba(16,42,33,0.06)] ${
                    !showMap
                      ? "bg-[var(--forest)] text-white"
                      : "border border-[rgba(16,42,33,0.12)] bg-white/82 text-[var(--foreground)]"
                  }`}
                >
                  {t("listings.listView")}
                </Link>
                <Link
                  href={`/listings?${buildListingSearchQueryString({ ...params, view: "map" })}`}
                  className={`rounded-full px-5 py-3 text-sm font-semibold shadow-[0_8px_24px_rgba(16,42,33,0.06)] ${
                    showMap
                      ? "bg-[var(--forest)] text-white"
                      : "border border-[rgba(16,42,33,0.12)] bg-white/82 text-[var(--foreground)]"
                  }`}
                >
                  {t("listings.mapView")}
                </Link>
              </div>
            </div>
          </div>

          <div className="bg-[#fcfaf6] px-4 py-4 sm:px-6 lg:px-8">
            <form className="grid gap-3 rounded-[1.5rem] border border-[rgba(16,42,33,0.08)] bg-white/92 p-4 text-sm text-[var(--muted)] shadow-[0_16px_32px_rgba(16,42,33,0.04)] sm:grid-cols-2 xl:grid-cols-4">
              <input
                type="search"
                name="q"
                defaultValue={params.q}
                placeholder={t("listings.form.searchPlaceholder")}
                className="rounded-[1rem] border border-[rgba(16,42,33,0.1)] bg-[#fffdfa] px-4 py-3 text-[var(--foreground)] outline-none xl:col-span-2"
              />
              <input
                type="text"
                name="municipality"
                defaultValue={params.municipality}
                placeholder={t("listings.form.municipalityPlaceholder")}
                className="rounded-[1rem] border border-[rgba(16,42,33,0.1)] bg-[#fffdfa] px-4 py-3 text-[var(--foreground)] outline-none"
              />
              <select
                name="type"
                defaultValue={params.type ?? ""}
                className="rounded-[1rem] border border-[rgba(16,42,33,0.1)] bg-[#fffdfa] px-4 py-3 text-[var(--foreground)] outline-none"
              >
                <option value="">{t("listings.form.allOfferTypes")}</option>
                {Object.values(ListingType).map((type) => (
                  <option key={type} value={type}>
                    {formatListingType(type, locale)}
                  </option>
                ))}
              </select>
              <select
                name="species"
                defaultValue={params.species ?? ""}
                className="rounded-[1rem] border border-[rgba(16,42,33,0.1)] bg-[#fffdfa] px-4 py-3 text-[var(--foreground)] outline-none"
              >
                <option value="">{t("listings.form.allSpecies")}</option>
                {Object.values(Species).map((species) => (
                  <option key={species} value={species}>
                    {formatSpecies([species], locale)}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="0"
                name="minPrice"
                defaultValue={params.minPrice ?? ""}
                placeholder={t("listings.form.minPrice")}
                className="rounded-[1rem] border border-[rgba(16,42,33,0.1)] bg-[#fffdfa] px-4 py-3 text-[var(--foreground)] outline-none"
              />
              <input
                type="number"
                min="0"
                name="maxPrice"
                defaultValue={params.maxPrice ?? ""}
                placeholder={t("listings.form.maxPrice")}
                className="rounded-[1rem] border border-[rgba(16,42,33,0.1)] bg-[#fffdfa] px-4 py-3 text-[var(--foreground)] outline-none"
              />
              <select
                name="availability"
                defaultValue={params.availability}
                className="rounded-[1rem] border border-[rgba(16,42,33,0.1)] bg-[#fffdfa] px-4 py-3 text-[var(--foreground)] outline-none"
              >
                <option value="all">{t("listings.form.allAvailability")}</option>
                <option value="open_now">{t("listings.form.openNow")}</option>
              </select>
              <input type="hidden" name="nearLat" value={params.nearLat ?? ""} />
              <input type="hidden" name="nearLng" value={params.nearLng ?? ""} />
              <input type="hidden" name="radiusKm" value={params.radiusKm} />
              <input type="hidden" name="north" value={params.north ?? ""} />
              <input type="hidden" name="south" value={params.south ?? ""} />
              <input type="hidden" name="east" value={params.east ?? ""} />
              <input type="hidden" name="west" value={params.west ?? ""} />
              <input type="hidden" name="view" value={params.view} />
              <div className="flex flex-wrap gap-3 sm:col-span-2 xl:col-span-4">
                <button
                  type="submit"
                  className="rounded-full bg-[var(--orange)] px-5 py-3 font-semibold text-white shadow-[0_14px_28px_rgba(245,106,20,0.2)]"
                >
                  {t("common.actions.updateSearch")}
                </button>
                <Link
                  href="/listings"
                  className="rounded-full border border-[rgba(16,42,33,0.12)] bg-white px-5 py-3 font-semibold text-[var(--foreground)]"
                >
                  {t("common.actions.clear")}
                </Link>
              </div>
            </form>
          </div>
        </div>

        <OfflinePageNote
          onlineText={t("listings.offlineOnline")}
          offlineText={t("listings.offlineOffline")}
        />

        <div className="grid gap-4 lg:grid-cols-4">
          <article className="rounded-[1.6rem] border border-[rgba(16,42,33,0.08)] bg-[rgba(255,255,255,0.86)] p-6 shadow-[0_16px_35px_rgba(16,42,33,0.05)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
              {t("listings.stats.results")}
            </p>
            <p className="mt-3 text-3xl text-[var(--forest)]">{listings.length}</p>
            <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
              {t("listings.stats.resultsBody")}
            </p>
          </article>
          <article className="rounded-[1.6rem] border border-[rgba(16,42,33,0.08)] bg-[rgba(255,255,255,0.86)] p-6 shadow-[0_16px_35px_rgba(16,42,33,0.05)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
              {t("listings.stats.nearby")}
            </p>
            <p className="mt-3 text-3xl text-[var(--forest)]">
              {params.nearLat !== null && params.nearLng !== null ? `${params.radiusKm} km` : t("listings.stats.nearbyOff")}
            </p>
            <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
              {t("listings.stats.nearbyBody")}
            </p>
          </article>
          <article className="rounded-[1.6rem] border border-[rgba(16,42,33,0.08)] bg-[rgba(255,255,255,0.86)] p-6 shadow-[0_16px_35px_rgba(16,42,33,0.05)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
              {t("listings.stats.mapArea")}
            </p>
            <p className="mt-3 text-3xl text-[var(--forest)]">
              {params.north !== null ? t("listings.stats.mapAreaActive") : t("listings.stats.mapAreaAll")}
            </p>
            <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
              {t("listings.stats.mapAreaBody")}
            </p>
          </article>
          <article className="rounded-[1.6rem] border border-[rgba(16,42,33,0.08)] bg-[rgba(255,255,255,0.86)] p-6 shadow-[0_16px_35px_rgba(16,42,33,0.05)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
              {t("listings.stats.api")}
            </p>
            <a
              href={`/api/listings/search${activeQuery ? `?${activeQuery}` : ""}`}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex rounded-full border border-[rgba(16,42,33,0.12)] bg-white px-4 py-2 text-sm font-semibold text-[var(--forest)]"
            >
              {t("listings.stats.openJson")}
            </a>
          </article>
        </div>

        {featuredListings.length > 0 && !showMap ? (
          <section className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--orange)]">
                  {locale === "en" ? "Featured first" : "Begynn med disse"}
                </p>
                <h2 className="mt-2 text-2xl text-[var(--foreground-strong)] sm:text-3xl">
                  {locale === "en"
                    ? "Listings that already feel like real trips."
                    : "Annonser som allerede oppleves som faktiske turer."}
                </h2>
              </div>
              <p className="max-w-xl text-sm leading-7 text-[var(--muted)]">
                {locale === "en"
                  ? "Use the stronger cards to scan trip type, host trust, distance, and availability before drilling into details."
                  : "Bruk de tydeligere kortene til a lese turtype, vertskapstillit, avstand og tilgjengelighet for du dykker ned i detaljene."}
              </p>
            </div>
            <div className="grid gap-5 xl:grid-cols-3">
              {featuredListings.map((listing) => (
                <Link
                  key={`featured-${listing.slug}`}
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
                          {t("listings.card.kmAway", { distance: listing.distanceKm.toFixed(1) })}
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
              ))}
            </div>
          </section>
        ) : null}

        {showMap ? <ListingsSearchMap results={listings} params={params} /> : null}

        {listings.length === 0 ? (
          <div className="rounded-[1.7rem] border border-[rgba(16,42,33,0.08)] bg-white/82 p-8 text-base leading-8 text-[var(--muted)] shadow-[0_16px_35px_rgba(16,42,33,0.05)]">
            {t("listings.empty")}
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
            {listings.map((listing) => (
              <Link
                key={listing.slug}
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
                          {t("listings.card.kmAway", { distance: listing.distanceKm.toFixed(1) })}
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
                        {t("listings.card.species")}
                      </p>
                      <p className="mt-2 font-medium text-[var(--foreground)]">
                        {formatSpecies(listing.species, locale)}
                      </p>
                    </div>
                    <div className="rounded-[1rem] bg-[rgba(239,232,219,0.46)] px-4 py-3 text-sm">
                      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                        {t("listings.card.pricing")}
                      </p>
                      <p className="mt-2 font-medium text-[var(--foreground)]">
                        {formatPricingModel(listing.pricingModel, locale)} · NOK{" "}
                        {listing.priceNok.toLocaleString("nb-NO")}
                      </p>
                    </div>
                    <div className="rounded-[1rem] bg-[rgba(239,232,219,0.46)] px-4 py-3 text-sm">
                      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                        {t("listings.card.availability")}
                      </p>
                      <p className="mt-2 font-medium text-[var(--foreground)]">
                        {listing.availabilityLabel}
                      </p>
                    </div>
                    <div className="rounded-[1rem] bg-[rgba(239,232,219,0.46)] px-4 py-3 text-sm">
                      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                        {t("listings.card.trust")}
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
                      <span className="text-sm text-[var(--muted)]">
                        {locale === "en" ? "Open listing" : "Apne annonse"}
                      </span>
                    )}
                    <span className="rounded-full bg-[var(--forest)] px-4 py-2 text-sm font-semibold text-white transition group-hover:bg-[var(--forest-soft)]">
                      {locale === "en" ? "View trip" : "Se tur"}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
