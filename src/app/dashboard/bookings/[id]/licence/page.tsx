import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { MobileActionTray } from "@/components/mobile/mobile-action-tray";
import { OfflineFreshnessNote } from "@/components/pwa/offline-freshness-note";
import { OfflinePageNote } from "@/components/pwa/offline-page-note";
import { OfflineSaveLinks } from "@/components/pwa/offline-save-links";
import { formatContractStatus, formatPaymentStatus } from "@/lib/commerce";
import { prisma } from "@/lib/prisma";

export default async function FishingLicenceProofPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login?callbackUrl=/dashboard/bookings");
  }

  const { id } = await params;
  const booking = await prisma.booking.findUnique({
    where: {
      id,
    },
    include: {
      contract: true,
      payment: true,
      listing: {
        include: {
          property: {
            select: {
              ownerId: true,
              municipality: true,
              county: true,
            },
          },
        },
      },
      hunter: {
        select: {
          pii: {
            select: {
              fullName: true,
            },
          },
          email: true,
        },
      },
    },
  });

  if (!booking || booking.listing.type !== "FISHING") {
    redirect("/dashboard/bookings");
  }

  const isAllowed =
    booking.hunterId === session.user.id ||
    booking.listing.property.ownerId === session.user.id ||
    session.user.role === "ADMIN";

  if (!isAllowed) {
    redirect("/dashboard/bookings");
  }

  const rules = (booking.listing.rules as {
    areaNotes?: string;
    gearRules?: string;
    bagLimitNotes?: string;
    requiresNationalFishingLicense?: boolean;
  } | null) ?? {};

  return (
    <main className="px-4 py-6 sm:px-6 md:px-8">
      <section className="mx-auto max-w-3xl space-y-5">
        <div className="rounded-[1.8rem] bg-[var(--forest)] p-6 text-[var(--background)]">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-white/65">
            Fiskebevis
          </p>
          <h1 className="mt-3 text-3xl leading-tight sm:text-4xl">{booking.listing.title}</h1>
          <p className="mt-3 text-base leading-7 text-white/75">
            Vis denne siden ute i felt som praktisk dokumentasjon. Den samler tidspunkt, bestillingsreferanse og lokale regler på ett sted.
          </p>
        </div>

        <OfflinePageNote
          onlineText="Lagre denne bevisvisningen før du mister dekning, så den fortsatt er tilgjengelig ved vannet."
          offlineText="Du er frakoblet. Denne bevisvisningen er lagret lokalt, men hvis bestillingen nylig er endret bør du synkronisere igjen når dekningen kommer tilbake."
        />
        <OfflineFreshnessNote
          updatedAt={booking.updatedAt.toISOString()}
          label="Denne bevisvisningen"
        />
        <OfflineSaveLinks
          scope={`licence-proof-${booking.id}`}
          links={[
            { href: `/dashboard/bookings/${booking.id}/licence`, label: "Fiskebevis" },
            { href: `/dashboard/bookings/${booking.id}`, label: "Bestillingsflate" },
            { href: `/listings/${booking.listing.slug}/field`, label: "Feltmodus" },
            { href: `/api/listings/${booking.listingId}/area`, label: "Lagret fiskeområde" },
          ]}
        />

        <article className="rounded-[1.7rem] border border-[var(--border)] bg-white/85 p-6 shadow-[0_18px_40px_rgba(16,42,33,0.08)]">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.2rem] border border-[var(--border)] bg-[#fbf8f1] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--amber)]">
                Gyldig for
              </p>
              <p className="mt-2 text-lg font-semibold text-[var(--forest)]">
                {booking.startDate.toLocaleDateString("nb-NO")} til {booking.endDate.toLocaleDateString("nb-NO")}
              </p>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Bestillingsreferanse: {booking.id.slice(0, 12).toUpperCase()}
              </p>
            </div>
            <div className="rounded-[1.2rem] border border-[var(--border)] bg-[#fbf8f1] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--amber)]">
                Innehaver
              </p>
              <p className="mt-2 text-lg font-semibold text-[var(--forest)]">
                {booking.hunter.pii?.fullName ?? booking.hunter.email}
              </p>
              <p className="mt-2 text-sm text-[var(--muted)]">
                {booking.listing.property.municipality}, {booking.listing.property.county}
              </p>
            </div>
            <div className="rounded-[1.2rem] border border-[var(--border)] bg-[#fbf8f1] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--amber)]">
                Kontrakt
              </p>
              <p className="mt-2 text-lg font-semibold text-[var(--forest)]">
                {booking.contract ? formatContractStatus(booking.contract.status) : "Ikke utstedt ennå"}
              </p>
            </div>
            <div className="rounded-[1.2rem] border border-[var(--border)] bg-[#fbf8f1] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--amber)]">
                Betaling
              </p>
              <p className="mt-2 text-lg font-semibold text-[var(--forest)]">
                {booking.payment ? formatPaymentStatus(booking.payment.status) : "Venter"}
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-3 text-sm leading-7 text-[var(--foreground)]">
            <p className="rounded-2xl border border-[#d8e6dc] bg-[#f4faf6] px-4 py-3 text-[#29543a]">
              Ha denne siden tilgjengelig sammen med annen lokal dokumentasjon dersom oppsyn eller grunneier ber om bekreftelse.
            </p>
            {rules.areaNotes ? (
              <p className="rounded-2xl border border-[var(--border)] px-4 py-3">
                Områdemerknader: {rules.areaNotes}
              </p>
            ) : null}
            {rules.gearRules ? (
              <p className="rounded-2xl border border-[var(--border)] px-4 py-3">
                Regler for utstyr: {rules.gearRules}
              </p>
            ) : null}
            {rules.bagLimitNotes ? (
              <p className="rounded-2xl border border-[var(--border)] px-4 py-3">
                Begrensninger: {rules.bagLimitNotes}
              </p>
            ) : null}
            {rules.requiresNationalFishingLicense ? (
              <p className="rounded-2xl border border-[#d0dfd6] bg-[#eef5f0] px-4 py-3 text-[#29543a]">
                Nasjonal fiskeravgift kan fortsatt være påkrevd i tillegg til denne lokale bestillingen.
              </p>
            ) : null}
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={`/dashboard/bookings/${booking.id}`}
              className="rounded-full bg-[var(--forest)] px-4 py-2 text-sm font-semibold text-white"
            >
              Bestillingsflate
            </Link>
            <Link
              href={`/listings/${booking.listing.slug}/field`}
              className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--foreground)]"
            >
              Feltmodus
            </Link>
          </div>
        </article>
      </section>
      <MobileActionTray
        title="Bevishandlinger"
        items={[
          { href: `/dashboard/bookings/${booking.id}`, label: "Bestilling" },
          { href: `/listings/${booking.listing.slug}/field`, label: "Feltmodus" },
          { href: `/listings/${booking.listing.slug}`, label: "Annonse" },
          { href: "/dashboard/bookings", label: "Turer" },
        ]}
      />
    </main>
  );
}
