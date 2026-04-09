import type { Metadata } from "next";
import Link from "next/link";
import { NearbyFishingFinder } from "@/components/fishing/nearby-fishing-finder";
import { OfflinePageNote } from "@/components/pwa/offline-page-note";
import {
  parseListingSearchParams,
  searchPublishedListings,
} from "@/lib/listing-search";
import { prisma } from "@/lib/prisma";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Nearby Fishing",
  description: "Mobile-first fishing discovery based on your current position in Norway.",
  alternates: {
    canonical: absoluteUrl("/listings/fishing/nearby"),
  },
};

export default async function NearbyFishingPage() {
  let listings = [] as Awaited<ReturnType<typeof searchPublishedListings>>;

  try {
    listings = await searchPublishedListings(
      prisma,
      parseListingSearchParams({
        type: "FISHING",
        availability: "open_now",
      }),
    );
  } catch (error) {
    console.warn("Nearby fishing page fell back to an empty list because listings could not be loaded.");
  }

  const mappedListings = listings
    .filter(
      (listing) => listing.latitude !== null && listing.longitude !== null && listing.type === "FISHING",
    )
    .map((listing) => ({
      id: listing.id,
      slug: listing.slug,
      title: listing.title,
      municipality: listing.municipality,
      county: listing.county,
      priceNok: listing.priceNok,
      instantBookEnabled: listing.instantBookEnabled,
      latitude: listing.latitude as number,
      longitude: listing.longitude as number,
      ruleSummary: listing.description,
      availabilityLabel: listing.availabilityLabel,
      trustLabel: listing.trustLabel,
    }));

  return (
    <main className="px-4 py-6 sm:px-6 md:px-8">
      <section className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-[1.8rem] bg-[var(--forest)] p-6 text-[var(--background)]">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-white/65">
            Mobile fishing journey
          </p>
          <h1 className="mt-3 text-3xl leading-tight sm:text-4xl">
            I found a river
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-white/75">
            Start from where you are, check the nearest sellable water, read the local rules, and jump straight into the licence flow if the offer supports instant purchase.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/listings"
              className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[var(--forest)]"
            >
              All listings
            </Link>
            <Link
              href="/dashboard"
              className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white"
            >
              Dashboard
            </Link>
          </div>
        </div>

        <OfflinePageNote
          onlineText="This nearby view works best with live location. Open a field mode page before you lose signal so the area notes stay available."
          offlineText="You are offline. Nearby sorting may be stale until location and network return, but cached field pages can still help once you pick an offer."
        />

        <NearbyFishingFinder listings={mappedListings} />
      </section>
    </main>
  );
}
