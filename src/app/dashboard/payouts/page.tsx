import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PayoutOnboardingForm } from "@/components/payouts/payout-onboarding-form";
import { OfflineFreshnessNote } from "@/components/pwa/offline-freshness-note";
import { OfflinePageNote } from "@/components/pwa/offline-page-note";
import { OfflineSaveLinks } from "@/components/pwa/offline-save-links";
import { hasRole } from "@/lib/access";
import { formatPaymentProvider, formatPaymentStatus } from "@/lib/commerce";
import { prisma } from "@/lib/prisma";

export default async function PayoutsPage() {
  const session = await auth();

  if (!session?.user || !hasRole(session, [UserRole.LANDOWNER, UserRole.ADMIN])) {
    redirect("/dashboard");
  }

  await prisma.paymentRecord.updateMany({
    where: {
      booking: {
        listing: {
          property: {
            ownerId: session.user.id,
          },
        },
      },
      status: "CAPTURED",
      payoutAvailableAt: {
        lte: new Date(),
      },
      payoutReleasedAt: null,
    },
    data: {
      payoutReleasedAt: new Date(),
    },
  });

  const currentUser = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      stripeConnectAccountId: true,
    },
  });

  const payments = await prisma.paymentRecord.findMany({
    where: {
      booking: {
        listing: {
          property: {
            ownerId: session.user.id,
          },
        },
      },
    },
    include: {
      booking: {
        select: {
          id: true,
          startDate: true,
          endDate: true,
          listing: {
            select: {
              title: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const pendingPayouts = payments.filter((payment) => payment.status === "CAPTURED" && !payment.payoutReleasedAt);
  const releasedPayouts = payments.filter((payment) => payment.payoutReleasedAt);
  const latestPaymentUpdate = payments[0]?.updatedAt ?? null;

  return (
    <main className="px-6 py-10 sm:px-8 md:px-10">
      <section className="space-y-6">
        <div className="overflow-hidden rounded-[2rem] border border-[rgba(16,42,33,0.1)] bg-[rgba(255,251,245,0.92)] shadow-[0_28px_80px_rgba(16,42,33,0.12)] backdrop-blur-sm">
          <div className="bg-[linear-gradient(135deg,rgba(10,25,22,0.96),rgba(27,58,44,0.88))] px-8 py-10 text-white">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/65">
              Utbetalinger
            </p>
            <h1 className="mt-3 text-4xl leading-tight sm:text-5xl">
              Følg opp ventende og fullførte utbetalinger.
            </h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-white/75">
              Dette er den første utbetalingsflaten for grunneiere. Den viser hva som er trukket, hva som fortsatt er innenfor 48-timersvinduet, og hva som allerede kan regnes som utbetalt.
            </p>
          </div>
          <div className="grid gap-4 border-t border-[rgba(16,42,33,0.08)] bg-[linear-gradient(180deg,rgba(255,252,246,0.96),rgba(245,239,229,0.94))] px-8 py-6 lg:grid-cols-3">
            <article className="rounded-[1.5rem] border border-[rgba(16,42,33,0.08)] bg-white/80 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
                Totalt antall poster
              </p>
              <p className="mt-3 text-2xl text-[var(--forest)]">{payments.length}</p>
            </article>
            <article className="rounded-[1.5rem] border border-[rgba(16,42,33,0.08)] bg-white/80 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
                Ventende utbetaling
              </p>
              <p className="mt-3 text-2xl text-[var(--forest)]">
                kr {pendingPayouts.reduce((sum, payment) => sum + payment.payoutNok, 0).toLocaleString("nb-NO")}
              </p>
            </article>
            <article className="rounded-[1.5rem] border border-[rgba(16,42,33,0.08)] bg-white/80 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
                Utbetalt
              </p>
              <p className="mt-3 text-2xl text-[var(--forest)]">
                kr {releasedPayouts.reduce((sum, payment) => sum + payment.payoutNok, 0).toLocaleString("nb-NO")}
              </p>
            </article>
          </div>
        </div>

        <OfflinePageNote
          onlineText="Åpne denne utbetalingssiden før du reiser hvis du vil ha et lagret øyeblikksbilde tilgjengelig når dekningen er svak."
          offlineText="Du er frakoblet. Tallene for utbetalte og ventende utbetalinger kommer fra sist lagrede versjon og kan ligge etter nyere endringer i bestillinger."
        />
        {latestPaymentUpdate ? (
          <OfflineFreshnessNote
            updatedAt={latestPaymentUpdate.toISOString()}
            label="Denne utbetalingsoversikten"
          />
        ) : null}
        <OfflineSaveLinks
          scope={`payouts-${session.user.id}`}
          links={[
            { href: "/dashboard/payouts", label: "Utbetalingsoversikt" },
            ...payments.slice(0, 5).map((payment) => ({
              href: `/dashboard/bookings/${payment.booking.id}`,
              label: `${payment.booking.listing.title} bestillingsflate`,
            })),
          ]}
        />

        <article className="rounded-[1.8rem] border border-[rgba(16,42,33,0.08)] bg-[linear-gradient(180deg,rgba(255,252,246,0.94),rgba(245,239,229,0.86))] p-6 shadow-[0_18px_44px_rgba(16,42,33,0.07)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
            Oppsett for utbetaling
          </p>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
            Denne lokale versjonen simulerer oppsett av Stripe Connect slik at utbetalingsflyten kan testes ende til ende før tredjeparts KYC er koblet til.
          </p>
          <div className="mt-4">
            <PayoutOnboardingForm isReady={Boolean(currentUser?.stripeConnectAccountId)} />
          </div>
        </article>

        <div className="grid gap-4">
          {payments.length === 0 ? (
            <div className="rounded-[1.8rem] border border-[rgba(16,42,33,0.08)] bg-[rgba(255,251,245,0.82)] p-6 text-sm leading-7 text-[var(--muted)] shadow-[0_18px_40px_rgba(16,42,33,0.06)]">
              Ingen utbetalingsposter ennå.
            </div>
          ) : (
            payments.map((payment) => (
              <article
                key={payment.id}
                className="rounded-[1.8rem] border border-[rgba(16,42,33,0.08)] bg-[linear-gradient(180deg,rgba(255,252,246,0.94),rgba(245,239,229,0.86))] p-6 shadow-[0_18px_44px_rgba(16,42,33,0.07)]"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--amber)]">
                  {payment.booking.listing.title}
                </p>
                <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                  {payment.booking.startDate.toLocaleDateString("nb-NO")} til {payment.booking.endDate.toLocaleDateString("nb-NO")}
                </p>
                <div className="mt-4 grid gap-3 text-sm leading-7 text-[var(--foreground)] sm:grid-cols-2 lg:grid-cols-4">
                  <p className="rounded-[1.15rem] border border-[rgba(16,42,33,0.08)] bg-white/72 px-4 py-3">Status: <span className="font-semibold">{formatPaymentStatus(payment.status)}</span></p>
                  <p className="rounded-[1.15rem] border border-[rgba(16,42,33,0.08)] bg-white/72 px-4 py-3">Leverandør: <span className="font-semibold">{formatPaymentProvider(payment.provider)}</span></p>
                  <p className="rounded-[1.15rem] border border-[rgba(16,42,33,0.08)] bg-white/72 px-4 py-3">Utbetaling: <span className="font-semibold">kr {payment.payoutNok.toLocaleString("nb-NO")}</span></p>
                  <p className="rounded-[1.15rem] border border-[rgba(16,42,33,0.08)] bg-white/72 px-4 py-3">Utbetalt: <span className="font-semibold">{payment.payoutReleasedAt ? payment.payoutReleasedAt.toLocaleDateString("nb-NO") : "Venter"}</span></p>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
