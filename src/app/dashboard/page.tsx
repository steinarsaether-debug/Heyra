import { auth } from "@/auth";
import Link from "next/link";
import { UserRole } from "@prisma/client";
import { TrustBadge } from "@/components/trust/trust-badge";
import { getUserRoles } from "@/lib/access";
import { getProfileCompletion, getRoleGuidance } from "@/lib/profile";
import { prisma } from "@/lib/prisma";
import { getAverageRating } from "@/lib/review-view";
import { summarizeAttributedBookings } from "@/lib/share-attribution";
import { getHostQualityBadge, getTrustSummary } from "@/lib/trust-summary";
import { formatUserRoles, formatUserStatus, getUserStatusGuidance } from "@/lib/user-status";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login?callbackUrl=/dashboard");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    include: {
      pii: true,
      consentRecords: true,
      properties: true,
      bookings: true,
      receivedReviews: {
        where: {
          moderationStatus: "APPROVED",
        },
        select: {
          rating: true,
        },
      },
    },
  });

  if (!user) {
    redirect("/auth/login");
  }

  const completion = getProfileCompletion(user);
  const userRoles = getUserRoles(user);
  const consentsGranted = user.consentRecords.filter((record) => !record.revokedAt).length;
  const averageRating = getAverageRating(user.receivedReviews.map((review) => review.rating));
  const trustSummary = getTrustSummary({
    averageRating,
    reviewCount: user.receivedReviews.length,
  });
  const landownerBookingStats =
    userRoles.includes(UserRole.LANDOWNER)
      ? await prisma.booking.findMany({
          where: {
            listing: {
              property: {
                ownerId: user.id,
              },
            },
          },
          select: {
            status: true,
          },
        })
      : [];
  const hostBadge =
    userRoles.includes(UserRole.LANDOWNER)
      ? getHostQualityBadge({
          averageRating,
          approvedReviewCount: user.receivedReviews.length,
          cancelledBookings: landownerBookingStats.filter((booking) => booking.status === "CANCELLED").length,
          totalBookings: landownerBookingStats.length,
        })
      : null;
  const notificationCount = await prisma.notificationOutbox.count({
    where: {
      userId: user.id,
    },
  });
  const complianceCount = await prisma.complianceTask.count({
    where: {
      userId: user.id,
      status: {
        in: ["OPEN", "IN_PROGRESS"],
      },
    },
  });
  const marketingSummary =
    userRoles.includes(UserRole.LANDOWNER)
      ? summarizeAttributedBookings(
          await prisma.booking.findMany({
            where: {
              listing: {
                property: {
                  ownerId: user.id,
                },
              },
            },
            select: {
              hunterAttestations: true,
            },
          }),
        )
      : null;
  const attributedBookings =
    marketingSummary?.lastTouch.reduce((sum, item) => sum + item.count, 0) ?? 0;
  const serviceSummary = await prisma.serviceProviderProfile.findUnique({
    where: {
      userId: user.id,
    },
    include: {
      services: {
        select: {
          id: true,
          status: true,
        },
      },
    },
  });
  const serviceCount = serviceSummary?.services.length ?? 0;
  const publishedServices =
    serviceSummary?.services.filter((service) => service.status === "PUBLISHED").length ?? 0;

  return (
    <main className="px-4 py-8 sm:px-6 sm:py-10 md:px-8">
      <section className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div
            className="overflow-hidden rounded-[2rem] p-8 text-[var(--background)] shadow-[0_24px_60px_rgba(16,42,33,0.12)]"
            style={{
              backgroundImage:
                "linear-gradient(135deg, rgba(10,25,22,0.92), rgba(10,25,22,0.68)), url(https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1800&q=80)",
              backgroundPosition: "center",
              backgroundSize: "cover",
            }}
          >
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-white/65">
              Oversikt
            </p>
            <h1 className="mt-5 text-4xl leading-tight sm:text-5xl">
              Velkommen tilbake, {session.user.fullName}.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/75">
              {getRoleGuidance(userRoles)}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/dashboard/profile"
                className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-[var(--forest)]"
              >
                Fullfør profil
              </Link>
              <Link
                href="/dashboard/settings/account"
                className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white"
              >
                Konto
              </Link>
              {userRoles.includes(UserRole.LANDOWNER) ? (
                <Link
                  href="/dashboard/properties/new"
                  className="rounded-full bg-[var(--amber)] px-5 py-3 text-sm font-semibold text-[var(--foreground)]"
                >
                  Start eiendomsutkast
                </Link>
              ) : null}
              <Link
                href="/listings"
                className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white"
              >
                Se annonser
              </Link>
              <Link
                href="/dashboard/bookings"
                className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white"
              >
                Åpne bestillinger
              </Link>
              <Link
                href="/dashboard/services"
                className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white"
              >
                Tjenester {serviceCount > 0 ? `(${serviceCount})` : ""}
              </Link>
              <Link
                href="/dashboard/compliance"
                className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white"
              >
                Etterlevelse {complianceCount > 0 ? `(${complianceCount})` : ""}
              </Link>
              {userRoles.includes(UserRole.LANDOWNER) ? (
                <Link
                  href="/dashboard/marketing"
                  className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white"
                >
                  Markedsføring
                </Link>
              ) : null}
              <Link
                href="/dashboard/notifications"
                className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white"
              >
                Varsler {notificationCount > 0 ? `(${notificationCount})` : ""}
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] border border-[rgba(16,42,33,0.08)] bg-[rgba(255,255,255,0.86)] p-8 shadow-[0_18px_40px_rgba(16,42,33,0.06)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--amber)]">
              Kontoberedskap
            </p>
            <p className="mt-4 text-5xl text-[var(--forest)]">{completion.percent}%</p>
            <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
              {completion.completed} av {completion.total} sentrale profilfelt er utfylt.
            </p>
            <div className="mt-5 h-3 rounded-full bg-[#e7e1d5]">
              <div
                className="h-3 rounded-full bg-[var(--amber)]"
                style={{ width: `${completion.percent}%` }}
              />
            </div>
          </div>
        </div>

        {user.status !== "ACTIVE" ? (
          <article className="rounded-[1.7rem] border border-[#d8c4a0] bg-[#fff9ef] p-6 shadow-[0_16px_35px_rgba(16,42,33,0.05)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
              Kontostatus
            </p>
            <p className="mt-3 text-2xl text-[var(--forest)]">{formatUserStatus(user.status)}</p>
            <p className="mt-3 text-sm leading-7 text-[#6b5432]">
              {getUserStatusGuidance({
                status: user.status,
                role: user.role,
                statusReason: user.statusReason,
              })}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/dashboard/settings/account"
                className="rounded-full border border-[#d8c4a0] bg-white px-4 py-2 text-sm font-semibold text-[#6b5432]"
              >
                Åpne kontostatus
              </Link>
              <Link
                href="/dashboard/profile"
                className="rounded-full border border-[#d8c4a0] bg-white px-4 py-2 text-sm font-semibold text-[#6b5432]"
              >
                Gå til profil
              </Link>
            </div>
          </article>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-6">
          <article className="rounded-[1.6rem] border border-[rgba(16,42,33,0.08)] bg-[rgba(255,255,255,0.86)] p-6 shadow-[0_16px_35px_rgba(16,42,33,0.05)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
              Rolle
            </p>
            <p className="mt-3 text-2xl text-[var(--forest)]">{formatUserRoles(userRoles)}</p>
          </article>
          <article className="rounded-[1.6rem] border border-[rgba(16,42,33,0.08)] bg-[rgba(255,255,255,0.86)] p-6 shadow-[0_16px_35px_rgba(16,42,33,0.05)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
              Status
            </p>
            <p className="mt-3 text-2xl text-[var(--forest)]">{formatUserStatus(user.status)}</p>
          </article>
          <article className="rounded-[1.6rem] border border-[rgba(16,42,33,0.08)] bg-[rgba(255,255,255,0.86)] p-6 shadow-[0_16px_35px_rgba(16,42,33,0.05)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
              Aktive samtykker
            </p>
            <p className="mt-3 text-2xl text-[var(--forest)]">{consentsGranted}</p>
          </article>
          <article className="rounded-[1.6rem] border border-[rgba(16,42,33,0.08)] bg-[rgba(255,255,255,0.86)] p-6 shadow-[0_16px_35px_rgba(16,42,33,0.05)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
              Eiendommer
            </p>
            <p className="mt-3 text-2xl text-[var(--forest)]">{user.properties.length}</p>
          </article>
          <article className="rounded-[1.6rem] border border-[rgba(16,42,33,0.08)] bg-[rgba(255,255,255,0.86)] p-6 shadow-[0_16px_35px_rgba(16,42,33,0.05)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
              Bestillinger
            </p>
            <p className="mt-3 text-2xl text-[var(--forest)]">{user.bookings.length}</p>
          </article>
          <article className="rounded-[1.6rem] border border-[rgba(16,42,33,0.08)] bg-[rgba(255,255,255,0.86)] p-6 shadow-[0_16px_35px_rgba(16,42,33,0.05)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
              Varsler
            </p>
            <p className="mt-3 text-2xl text-[var(--forest)]">{notificationCount}</p>
          </article>
          <article className="rounded-[1.6rem] border border-[rgba(16,42,33,0.08)] bg-[rgba(255,255,255,0.86)] p-6 shadow-[0_16px_35px_rgba(16,42,33,0.05)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
              Tjenester
            </p>
            <p className="mt-3 text-2xl text-[var(--forest)]">{publishedServices}/{serviceCount}</p>
          </article>
          <article className="rounded-[1.5rem] border border-[var(--border)] bg-white/70 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
              Etterlevelse
            </p>
            <p className="mt-3 text-2xl text-[var(--forest)]">{complianceCount}</p>
          </article>
        </div>

        <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <article className="rounded-[1.7rem] border border-[rgba(16,42,33,0.08)] bg-[rgba(255,255,255,0.86)] p-6 shadow-[0_18px_40px_rgba(16,42,33,0.06)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
              Tillitsoversikt
            </p>
            <p className="mt-4 text-2xl text-[var(--forest)]">{trustSummary.label}</p>
            <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{trustSummary.detail}</p>
            <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
              {averageRating ? `${averageRating.toFixed(1)} / 5` : "Ingen anmeldelser ennå"} · {user.receivedReviews.length} godkjent anmeldelse{user.receivedReviews.length === 1 ? "" : "r"}
            </p>
            {hostBadge ? (
              <div className="mt-4">
                <TrustBadge {...hostBadge} />
              </div>
            ) : null}
          </article>

          {userRoles.includes(UserRole.LANDOWNER) ? (
            <article className="rounded-[1.7rem] border border-[rgba(16,42,33,0.08)] bg-[rgba(255,255,255,0.86)] p-6 shadow-[0_18px_40px_rgba(16,42,33,0.06)]">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
                Markedsoversikt
              </p>
              <p className="mt-4 text-2xl text-[var(--forest)]">
                {attributedBookings} attribuert bestillingsforespørsel{attributedBookings === 1 ? "" : "er"}
              </p>
              <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                Delte annonselenker kan nå bidra til attribusjon av bestillinger, så du kan se om din egen markedsføring faktisk skaper etterspørsel.
              </p>
              <div className="mt-4 space-y-3 text-sm leading-7 text-[var(--foreground)]">
                <p className="rounded-2xl border border-[var(--border)] px-4 py-3">
                  {marketingSummary?.lastTouch[0]
                    ? `Viktigste siste kilde: ${marketingSummary.lastTouch[0].label} (${marketingSummary.lastTouch[0].count})`
                    : "Ingen tagget bestillingskilde er registrert ennå."}
                </p>
                <Link
                  href="/dashboard/marketing"
                  className="block rounded-2xl border border-[var(--border)] px-4 py-3 font-semibold text-[var(--forest)]"
                >
                  Åpne markedsinnsikt
                </Link>
              </div>
            </article>
          ) : (
            <article className="rounded-[1.7rem] border border-[rgba(16,42,33,0.08)] bg-[rgba(255,255,255,0.86)] p-6 shadow-[0_18px_40px_rgba(16,42,33,0.06)]">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
                Tillit i praksis
              </p>
              <div className="mt-4 space-y-3 text-sm leading-7 text-[var(--foreground)]">
                <p className="rounded-2xl border border-[var(--border)] px-4 py-3">
                  Anmeldelser, tvister og modereringshistorikk påvirker nå hvordan andre brukere ser kontoen din.
                </p>
                <p className="rounded-2xl border border-[var(--border)] px-4 py-3">
                  Tydelig kommunikasjon rundt bestillinger og lav avbestillingsrate styrker tillitsprofilen din mer enn markedsføringstekst.
                </p>
                <p className="rounded-2xl border border-[var(--border)] px-4 py-3">
                  Anmeldelsene og erfaringene dine blir tillitssignaler for andre jegere og fiskere.
                </p>
              </div>
            </article>
          )}
        </section>

        <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
          <section className="rounded-[1.7rem] border border-[rgba(16,42,33,0.08)] bg-[rgba(255,255,255,0.86)] p-6 shadow-[0_18px_40px_rgba(16,42,33,0.06)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
              Neste oppstartsoppgaver
            </p>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-[var(--foreground)]">
              {completion.fields.map((field) => (
                <li
                  key={field.key}
                  className="rounded-2xl border border-[var(--border)] px-4 py-3"
                >
                  {field.complete ? "Fullført" : "Trengs"}: {field.label}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-[1.7rem] border border-[rgba(16,42,33,0.08)] bg-[rgba(255,255,255,0.86)] p-6 shadow-[0_18px_40px_rgba(16,42,33,0.06)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
              Hva kommer nå
            </p>
            <div className="mt-4 space-y-3 text-sm leading-7 text-[var(--foreground)]">
              <p className="rounded-2xl border border-[var(--border)] px-4 py-3">
                Legg til rollebasert oppfølging etter dette felles profillaget.
              </p>
              {userRoles.includes(UserRole.LANDOWNER) ? (
                <>
                  <p className="rounded-2xl border border-[var(--border)] px-4 py-3">
                    Grunneiere bør gå videre til opprettelse av eiendom og oppsett av annonse.
                  </p>
                  <p className="rounded-2xl border border-[var(--border)] px-4 py-3">
                    Etter grense-steget bør du lage et annonseutkast og sende det til gjennomgang.
                  </p>
                  <p className="rounded-2xl border border-[var(--border)] px-4 py-3">
                    Følg med på bestillingsforespørsler i bestillingsflaten og svar raskt.
                  </p>
                </>
              ) : (
                <>
                  <p className="rounded-2xl border border-[var(--border)] px-4 py-3">
                    Jegere bør gå videre til kvalifisering, oppdagelse og bestillingsberedskap.
                  </p>
                  <p className="rounded-2xl border border-[var(--border)] px-4 py-3">
                    Bruk publiserte annonser for å be om turer, og følg deretter godkjenninger fra bestillingssiden.
                  </p>
                </>
              )}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
