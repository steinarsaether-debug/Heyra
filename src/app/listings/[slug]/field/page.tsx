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
      title: "Feltmodus ikke funnet",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  return {
    title: `${listing.title} · feltmodus`,
    description:
      listing.type === "FISHING"
        ? "Forenklet feltvisning for fiskeregler, områdemerknader og grensesjekk."
        : "Forenklet feltvisning for turdetaljer og praktiske referanser.",
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
            Feltmodus
          </p>
          <h1 className="mt-3 text-3xl leading-tight sm:text-4xl">{listing.title}</h1>
          <p className="mt-3 text-base leading-7 text-white/75">
            En forenklet visning for når du allerede er ute på vei, i terrenget eller ved vannet og trenger de viktigste reglene raskt.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={`/listings/${listing.slug}`}
              className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[var(--forest)]"
            >
              Full annonse
            </Link>
            {listing.type === "FISHING" ? (
              <Link
                href="/listings/fishing/nearby"
                className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white"
              >
                Fiske i nærheten
              </Link>
            ) : null}
            {session?.user?.role === UserRole.HUNTER ? (
              <Link
                href={`/listings/${listing.slug}`}
                className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white"
              >
                Start bestilling
              </Link>
            ) : null}
          </div>
        </div>

        <OfflinePageNote
          onlineText="Denne feltvisningen er laget for enkel bruk underveis. Lagre den før du mister dekning."
          offlineText="Du er frakoblet. Denne feltvisningen er lagret lokalt, så sjekk regler og grenser på nytt når dekningen kommer tilbake."
        />
        <OfflineFreshnessNote
          updatedAt={listing.updatedAt.toISOString()}
          label="Denne feltvisningen"
        />
        <OfflineSaveLinks
          scope={`field-${listing.id}`}
          links={[
            { href: `/listings/${listing.slug}/field`, label: "Feltmodus" },
            { href: `/listings/${listing.slug}`, label: "Full annonse" },
            { href: `/api/listings/${listing.id}/area`, label: "Referanse for områdegrense" },
          ]}
        />

        <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <article className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--amber)]">
              Kort praktisk sammendrag
            </p>
            <div className="mt-4 grid gap-3 text-sm leading-7 text-[var(--foreground)]">
              <p className="rounded-2xl border border-[var(--border)] px-4 py-3">
                {formatSpecies(listing.species, "nb")} · {formatPricingModel(listing.pricingModel, "nb")} · NOK {listing.priceNok.toLocaleString("nb-NO")}
              </p>
              <p className="rounded-2xl border border-[var(--border)] px-4 py-3">
                Område: {listing.property.municipality}, {listing.property.county}
              </p>
              {listing.property.cwdZone ? (
                <p className="rounded-2xl border border-[#e7d6ae] bg-[#fff8eb] px-4 py-3 text-[#6e5630]">
                  Registrert CWD-overlapp: {listing.property.cwdZone.name}
                </p>
              ) : null}
              {rules.requiresNationalFishingLicense ? (
                <p className="rounded-2xl border border-[#d0dfd6] bg-[#eef5f0] px-4 py-3 text-[#29543a]">
                  Nasjonal fiskeravgift kan også være påkrevd før du begynner.
                </p>
              ) : null}
            </div>
          </article>

          <article className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--amber)]">
              Regler og begrensninger
            </p>
            <div className="mt-4 space-y-3 text-sm leading-7 text-[var(--foreground)]">
              {rules.speciesRestrictions ? (
                <p className="rounded-2xl border border-[var(--border)] px-4 py-3">
                  Arter: {rules.speciesRestrictions}
                </p>
              ) : null}
              {rules.gearRules ? (
                <p className="rounded-2xl border border-[var(--border)] px-4 py-3">
                  Utstyr: {rules.gearRules}
                </p>
              ) : null}
              {rules.bagLimitNotes ? (
                <p className="rounded-2xl border border-[var(--border)] px-4 py-3">
                  Begrensninger: {rules.bagLimitNotes}
                </p>
              ) : null}
              {rules.areaNotes ? (
                <p className="rounded-2xl border border-[var(--border)] px-4 py-3">
                  Områdemerknader: {rules.areaNotes}
                </p>
              ) : (
                <p className="rounded-2xl border border-[var(--border)] px-4 py-3">
                  Hold deg innenfor det angitte fiskeområdet som vises nedenfor og på den fulle annonsesiden.
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
            Geofencing-støtte er foreløpig mest rettet mot fisketilbud, der mobil grensebevissthet er viktigst ute i felt.
          </article>
        )}

        <div id="field-log">
          <FieldTripLogger
            storageKey={`heyra-field-log:${listing.id}`}
            mode={listing.type === "FISHING" ? "fishing" : "hunting"}
            title={listing.type === "FISHING" ? "Feltlogg for fiske" : "Dagslogg for jakt"}
          />
        </div>
      </section>
      <MobileActionTray
        title="Felthandlinger"
        items={[
          { href: `/listings/${listing.slug}`, label: "Annonse" },
          session?.user?.role === UserRole.HUNTER
            ? { href: `/listings/${listing.slug}`, label: "Bestilling" }
            : { onClickAnchorId: "area-check", label: "Grense" },
          { onClickAnchorId: "area-check", label: "Grense" },
          { onClickAnchorId: "field-log", label: "Logg" },
          ...(listing.type === "FISHING"
            ? [{ href: "/listings/fishing/nearby", label: "I nærheten" }]
            : []),
        ]}
      />
    </main>
  );
}
