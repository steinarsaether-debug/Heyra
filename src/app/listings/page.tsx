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

  return (
    <main className="px-6 py-10 sm:px-8 md:px-10">
      <section className="space-y-8">
        <div className="overflow-hidden rounded-[1.8rem] border border-[var(--border)] bg-white">
          <div className="heyra-discovery-hero px-6 py-8 sm:px-8 sm:py-10">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--amber)]">
              {t("listings.eyebrow")}
            </p>
            <h1 className="mt-3 text-4xl leading-tight text-[var(--forest)] sm:text-5xl">
              {t("listings.title")}
            </h1>
            <p className="mt-4 text-lg leading-8 text-[var(--muted)]">
              {t("listings.body")}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <NearbySearchButton />
              <Link
                href="/listings/fishing/nearby"
                className="rounded-full border border-[var(--border)] px-5 py-3 text-sm font-semibold text-[var(--foreground)]"
              >
                {t("listings.nearbyFishingView")}
              </Link>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/listings${activeQuery ? `?${activeQuery}` : ""}`}
              className={`rounded-full px-5 py-3 text-sm font-semibold ${
                params.view === "list"
                  ? "bg-[var(--forest)] text-white"
                  : "border border-[var(--border)] text-[var(--foreground)]"
              }`}
            >
              {t("listings.listView")}
            </Link>
            <Link
              href={`/listings?${buildListingSearchQueryString({ ...params, view: "map" })}`}
              className={`rounded-full px-5 py-3 text-sm font-semibold ${
                params.view === "map"
                  ? "bg-[var(--forest)] text-white"
                  : "border border-[var(--border)] text-[var(--foreground)]"
              }`}
            >
              {t("listings.mapView")}
            </Link>
          </div>
            </div>
          </div>

          <div className="border-t border-[var(--border)] bg-[#fcfaf6] px-4 py-4 sm:px-6">
        <form className="grid gap-3 rounded-[1.3rem] border border-[var(--border)] bg-white p-4 text-sm text-[var(--muted)] sm:grid-cols-2 xl:grid-cols-4">
          <input
            type="search"
            name="q"
            defaultValue={params.q}
            placeholder={t("listings.form.searchPlaceholder")}
            className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-[var(--foreground)] outline-none xl:col-span-2"
          />
          <input
            type="text"
            name="municipality"
            defaultValue={params.municipality}
            placeholder={t("listings.form.municipalityPlaceholder")}
            className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-[var(--foreground)] outline-none"
          />
          <select
            name="type"
            defaultValue={params.type ?? ""}
            className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-[var(--foreground)] outline-none"
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
            className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-[var(--foreground)] outline-none"
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
            className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-[var(--foreground)] outline-none"
          />
          <input
            type="number"
            min="0"
            name="maxPrice"
            defaultValue={params.maxPrice ?? ""}
            placeholder={t("listings.form.maxPrice")}
            className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-[var(--foreground)] outline-none"
          />
          <select
            name="availability"
            defaultValue={params.availability}
            className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-[var(--foreground)] outline-none"
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
              className="rounded-full bg-[var(--orange)] px-5 py-3 font-semibold text-white"
            >
              {t("common.actions.updateSearch")}
            </button>
            <Link
              href="/listings"
              className="rounded-full border border-[var(--border)] px-5 py-3 font-semibold text-[var(--foreground)]"
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
          <article className="rounded-[1.5rem] border border-[var(--border)] bg-white/75 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
              {t("listings.stats.results")}
            </p>
            <p className="mt-3 text-2xl text-[var(--forest)]">{listings.length}</p>
            <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
              {t("listings.stats.resultsBody")}
            </p>
          </article>
          <article className="rounded-[1.5rem] border border-[var(--border)] bg-white/75 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
              {t("listings.stats.nearby")}
            </p>
            <p className="mt-3 text-2xl text-[var(--forest)]">
              {params.nearLat !== null && params.nearLng !== null ? `${params.radiusKm} km` : t("listings.stats.nearbyOff")}
            </p>
            <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
              {t("listings.stats.nearbyBody")}
            </p>
          </article>
          <article className="rounded-[1.5rem] border border-[var(--border)] bg-white/75 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
              {t("listings.stats.mapArea")}
            </p>
            <p className="mt-3 text-2xl text-[var(--forest)]">
              {params.north !== null ? t("listings.stats.mapAreaActive") : t("listings.stats.mapAreaAll")}
            </p>
            <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
              {t("listings.stats.mapAreaBody")}
            </p>
          </article>
          <article className="rounded-[1.5rem] border border-[var(--border)] bg-white/75 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
              {t("listings.stats.api")}
            </p>
            <a
              href={`/api/listings/search${activeQuery ? `?${activeQuery}` : ""}`}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--forest)]"
            >
              {t("listings.stats.openJson")}
            </a>
          </article>
        </div>

        {params.view === "map" ? <ListingsSearchMap results={listings} params={params} /> : null}

        {listings.length === 0 ? (
          <div className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-8 text-base leading-8 text-[var(--muted)]">
            {t("listings.empty")}
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {listings.map((listing) => (
              <Link
                key={listing.slug}
                href={`/listings/${listing.slug}`}
                className="overflow-hidden rounded-[1.5rem] border border-[var(--border)] bg-white/88 transition hover:-translate-y-0.5 hover:bg-white"
              >
                {listing.leadPhoto ? (
                  <div className="relative mb-4 h-48 overflow-hidden border-b border-[var(--border)]">
                    <Image
                      src={listing.leadPhoto}
                      alt={listing.title}
                      width={900}
                      height={560}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : null}
                <div className="p-6 pt-0">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--amber)]">
                  {formatListingType(listing.type, locale)}
                  {listing.distanceKm !== null
                    ? ` · ${t("listings.card.kmAway", { distance: listing.distanceKm.toFixed(1) })}`
                    : ""}
                </p>
                <h2 className="mt-3 text-2xl text-[var(--forest)]">{listing.title}</h2>
                <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                  {listing.municipality}, {listing.county}
                </p>
                <p className="mt-2 text-sm leading-7 text-[var(--foreground)] line-clamp-3">
                  {listing.description}
                </p>
                <dl className="mt-4 space-y-2 text-sm leading-7 text-[var(--foreground)]">
                  <div>
                    <dt className="font-semibold">{t("listings.card.species")}</dt>
                    <dd>{formatSpecies(listing.species, locale)}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold">{t("listings.card.pricing")}</dt>
                    <dd>
                      {formatPricingModel(listing.pricingModel, locale)} · NOK{" "}
                      {listing.priceNok.toLocaleString("nb-NO")}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold">{t("listings.card.availability")}</dt>
                    <dd>{listing.availabilityLabel}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold">{t("listings.card.trust")}</dt>
                    <dd>{listing.trustLabel}</dd>
                  </div>
                </dl>
                {listing.hostBadgeLabel ? (
                  <div className="mt-4">
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
        )}
      </section>
    </main>
  );
}
