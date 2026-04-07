import type { Metadata } from "next";
import { UserRole } from "@prisma/client";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { FieldTripLogger } from "@/components/field/field-trip-logger";
import { MobileActionTray } from "@/components/mobile/mobile-action-tray";
import { FishingAreaWarning } from "@/components/fishing/fishing-area-warning";
import { OfflineFreshnessNote } from "@/components/pwa/offline-freshness-note";
import { OfflinePageNote } from "@/components/pwa/offline-page-note";
import { OfflineSaveLinks } from "@/components/pwa/offline-save-links";
import { formatPricingModel, formatSpecies } from "@/lib/listing-view";
import { prisma } from "@/lib/prisma";
import { absoluteUrl } from "@/lib/site";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const listing = await prisma.listing.findFirst({
    where: {
      slug,
      status: "PUBLISHED",
    },
    select: {
      title: true,
      type: true,
    },
  });

  if (!listing) {
    return {
      title: "Field mode not found",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  return {
    title: `${listing.title} field mode`,
    description:
      listing.type === "FISHING"
        ? "Low-friction field view for fishing rules, area notes, and boundary checks."
        : "Low-friction field view for trip reference details.",
    alternates: {
      canonical: absoluteUrl(`/listings/${slug}/field`),
    },
  };
}

export default async function ListingFieldModePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await auth();
  const { slug } = await params;
  const listing = await prisma.listing.findFirst({
    where: {
      slug,
      status: "PUBLISHED",
    },
    include: {
      property: {
        select: {
          municipality: true,
          county: true,
          cwdZone: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  if (!listing) {
    notFound();
  }

  const rules = (listing.rules as {
    speciesRestrictions?: string;
    gearRules?: string;
    bagLimitNotes?: string;
    areaNotes?: string;
    requiresNationalFishingLicense?: boolean;
  } | null) ?? {};

  return (
    <main className="px-4 py-6 sm:px-6 md:px-8">
      <section className="mx-auto max-w-4xl space-y-5">
        <div className="rounded-[1.8rem] bg-[var(--forest)] p-6 text-[var(--background)]">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-white/65">
            Field mode
          </p>
          <h1 className="mt-3 text-3xl leading-tight sm:text-4xl">{listing.title}</h1>
          <p className="mt-3 text-base leading-7 text-white/75">
            A simplified view for when you are already out on the road or standing near the water and need the key rules fast.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={`/listings/${listing.slug}`}
              className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[var(--forest)]"
            >
              Full listing
            </Link>
            {listing.type === "FISHING" ? (
              <Link
                href="/listings/fishing/nearby"
                className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white"
              >
                Nearby fishing
              </Link>
            ) : null}
            {session?.user?.role === UserRole.HUNTER ? (
              <Link
                href={`/listings/${listing.slug}`}
                className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white"
              >
                Start checkout
              </Link>
            ) : null}
          </div>
        </div>

        <OfflinePageNote
          onlineText="This field view is designed for low-friction use on the move. Save it before you leave signal behind."
          offlineText="You are offline. This field view is cached locally, so always re-check rules and boundaries when coverage returns."
        />
        <OfflineFreshnessNote
          updatedAt={listing.updatedAt.toISOString()}
          label="This field view"
        />
        <OfflineSaveLinks
          scope={`field-${listing.id}`}
          links={[
            { href: `/listings/${listing.slug}/field`, label: "Field mode" },
            { href: `/listings/${listing.slug}`, label: "Full listing detail" },
            { href: `/api/listings/${listing.id}/area`, label: "Area boundary reference" },
          ]}
        />

        <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <article className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--amber)]">
              Quick practical summary
            </p>
            <div className="mt-4 grid gap-3 text-sm leading-7 text-[var(--foreground)]">
              <p className="rounded-2xl border border-[var(--border)] px-4 py-3">
                {formatSpecies(listing.species, "nb")} · {formatPricingModel(listing.pricingModel, "nb")} · NOK {listing.priceNok.toLocaleString("nb-NO")}
              </p>
              <p className="rounded-2xl border border-[var(--border)] px-4 py-3">
                Area: {listing.property.municipality}, {listing.property.county}
              </p>
              {listing.property.cwdZone ? (
                <p className="rounded-2xl border border-[#e7d6ae] bg-[#fff8eb] px-4 py-3 text-[#6e5630]">
                  CWD zone overlap recorded: {listing.property.cwdZone.name}
                </p>
              ) : null}
              {rules.requiresNationalFishingLicense ? (
                <p className="rounded-2xl border border-[#d0dfd6] bg-[#eef5f0] px-4 py-3 text-[#29543a]">
                  National fishing licence may also be required before you start.
                </p>
              ) : null}
            </div>
          </article>

          <article className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--amber)]">
              Rules and limitations
            </p>
            <div className="mt-4 space-y-3 text-sm leading-7 text-[var(--foreground)]">
              {rules.speciesRestrictions ? (
                <p className="rounded-2xl border border-[var(--border)] px-4 py-3">
                  Species: {rules.speciesRestrictions}
                </p>
              ) : null}
              {rules.gearRules ? (
                <p className="rounded-2xl border border-[var(--border)] px-4 py-3">
                  Gear: {rules.gearRules}
                </p>
              ) : null}
              {rules.bagLimitNotes ? (
                <p className="rounded-2xl border border-[var(--border)] px-4 py-3">
                  Limits: {rules.bagLimitNotes}
                </p>
              ) : null}
              {rules.areaNotes ? (
                <p className="rounded-2xl border border-[var(--border)] px-4 py-3">
                  Area notes: {rules.areaNotes}
                </p>
              ) : (
                <p className="rounded-2xl border border-[var(--border)] px-4 py-3">
                  Stay inside the designated fishing area shown below and on the full listing page.
                </p>
              )}
            </div>
          </article>
        </div>

        {listing.type === "FISHING" ? (
          <div id="area-check">
            <FishingAreaWarning
              listingId={listing.id}
              areaNotes={rules.areaNotes ?? ""}
            />
          </div>
        ) : (
          <article className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6 text-sm leading-7 text-[var(--muted)]">
            Geofencing support is currently focused on fishing listings, where mobile boundary awareness matters most in the field.
          </article>
        )}

        <div id="field-log">
          <FieldTripLogger
            storageKey={`heyra-field-log:${listing.id}`}
            mode={listing.type === "FISHING" ? "fishing" : "hunting"}
            title={listing.type === "FISHING" ? "Fishing field log" : "Hunt day log"}
          />
        </div>
      </section>
      <MobileActionTray
        title="Field actions"
        items={[
          { href: `/listings/${listing.slug}`, label: "Listing" },
          session?.user?.role === UserRole.HUNTER
            ? { href: `/listings/${listing.slug}`, label: "Checkout" }
            : { onClickAnchorId: "area-check", label: "Boundary" },
          { onClickAnchorId: "area-check", label: "Boundary" },
          { onClickAnchorId: "field-log", label: "Log" },
          ...(listing.type === "FISHING"
            ? [{ href: "/listings/fishing/nearby", label: "Nearby" }]
            : []),
        ]}
      />
    </main>
  );
}
