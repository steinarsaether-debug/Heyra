import { auth } from "@/auth";
import Link from "next/link";
import { UserRole } from "@prisma/client";
import { TrustBadge } from "@/components/trust/trust-badge";
import { getProfileCompletion, getRoleGuidance } from "@/lib/profile";
import { prisma } from "@/lib/prisma";
import { getAverageRating } from "@/lib/review-view";
import { summarizeAttributedBookings } from "@/lib/share-attribution";
import { getHostQualityBadge, getTrustSummary } from "@/lib/trust-summary";
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
  const consentsGranted = user.consentRecords.filter((record) => !record.revokedAt).length;
  const averageRating = getAverageRating(user.receivedReviews.map((review) => review.rating));
  const trustSummary = getTrustSummary({
    averageRating,
    reviewCount: user.receivedReviews.length,
  });
  const landownerBookingStats =
    user.role === UserRole.LANDOWNER
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
    user.role === UserRole.LANDOWNER
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
    user.role === UserRole.LANDOWNER
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
    <main className="px-6 py-10 sm:px-8 md:px-10">
      <section className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[1.8rem] bg-[var(--forest)] p-8 text-[var(--background)]">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-white/65">
              Dashboard
            </p>
            <h1 className="mt-5 text-4xl leading-tight sm:text-5xl">
              Welcome back, {session.user.fullName}.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/75">
              {getRoleGuidance(user.role)}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/dashboard/profile"
                className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-[var(--forest)]"
              >
                Complete profile
              </Link>
              {user.role === UserRole.LANDOWNER ? (
                <Link
                  href="/dashboard/properties/new"
                  className="rounded-full bg-[var(--amber)] px-5 py-3 text-sm font-semibold text-[var(--foreground)]"
                >
                  Start property draft
                </Link>
              ) : null}
              <Link
                href="/listings"
                className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white"
              >
                Browse listings
              </Link>
              <Link
                href="/dashboard/bookings"
                className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white"
              >
                Open bookings
              </Link>
              <Link
                href="/dashboard/services"
                className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white"
              >
                Services {serviceCount > 0 ? `(${serviceCount})` : ""}
              </Link>
              <Link
                href="/dashboard/compliance"
                className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white"
              >
                Compliance {complianceCount > 0 ? `(${complianceCount})` : ""}
              </Link>
              {user.role === UserRole.LANDOWNER ? (
                <Link
                  href="/dashboard/marketing"
                  className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white"
                >
                  Marketing
                </Link>
              ) : null}
              <Link
                href="/dashboard/notifications"
                className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white"
              >
                Alerts {notificationCount > 0 ? `(${notificationCount})` : ""}
              </Link>
            </div>
          </div>

          <div className="rounded-[1.8rem] border border-[var(--border)] bg-white/75 p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--amber)]">
              Account readiness
            </p>
            <p className="mt-4 text-5xl text-[var(--forest)]">{completion.percent}%</p>
            <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
              {completion.completed} of {completion.total} core profile fields are complete.
            </p>
            <div className="mt-5 h-3 rounded-full bg-[#e7e1d5]">
              <div
                className="h-3 rounded-full bg-[var(--amber)]"
                style={{ width: `${completion.percent}%` }}
              />
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-6">
          <article className="rounded-[1.5rem] border border-[var(--border)] bg-white/70 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
              Role
            </p>
            <p className="mt-3 text-2xl text-[var(--forest)]">{user.role.toLowerCase()}</p>
          </article>
          <article className="rounded-[1.5rem] border border-[var(--border)] bg-white/70 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
              Active consents
            </p>
            <p className="mt-3 text-2xl text-[var(--forest)]">{consentsGranted}</p>
          </article>
          <article className="rounded-[1.5rem] border border-[var(--border)] bg-white/70 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
              Properties
            </p>
            <p className="mt-3 text-2xl text-[var(--forest)]">{user.properties.length}</p>
          </article>
          <article className="rounded-[1.5rem] border border-[var(--border)] bg-white/70 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
              Bookings
            </p>
            <p className="mt-3 text-2xl text-[var(--forest)]">{user.bookings.length}</p>
          </article>
          <article className="rounded-[1.5rem] border border-[var(--border)] bg-white/70 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
              Alerts
            </p>
            <p className="mt-3 text-2xl text-[var(--forest)]">{notificationCount}</p>
          </article>
          <article className="rounded-[1.5rem] border border-[var(--border)] bg-white/70 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
              Services
            </p>
            <p className="mt-3 text-2xl text-[var(--forest)]">{publishedServices}/{serviceCount}</p>
          </article>
          <article className="rounded-[1.5rem] border border-[var(--border)] bg-white/70 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
              Compliance
            </p>
            <p className="mt-3 text-2xl text-[var(--forest)]">{complianceCount}</p>
          </article>
        </div>

        <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <article className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
              Trust snapshot
            </p>
            <p className="mt-4 text-2xl text-[var(--forest)]">{trustSummary.label}</p>
            <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{trustSummary.detail}</p>
            <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
              {averageRating ? `${averageRating.toFixed(1)} / 5` : "No reviews yet"} · {user.receivedReviews.length} approved review{user.receivedReviews.length === 1 ? "" : "s"}
            </p>
            {hostBadge ? (
              <div className="mt-4">
                <TrustBadge {...hostBadge} />
              </div>
            ) : null}
          </article>

          {user.role === UserRole.LANDOWNER ? (
            <article className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
                Marketing snapshot
              </p>
              <p className="mt-4 text-2xl text-[var(--forest)]">
                {attributedBookings} attributed booking request{attributedBookings === 1 ? "" : "s"}
              </p>
              <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                Shared listing links can now feed into booking attribution, so you can see whether your own promotion is leading to real demand.
              </p>
              <div className="mt-4 space-y-3 text-sm leading-7 text-[var(--foreground)]">
                <p className="rounded-2xl border border-[var(--border)] px-4 py-3">
                  {marketingSummary?.lastTouch[0]
                    ? `Top latest source: ${marketingSummary.lastTouch[0].label} (${marketingSummary.lastTouch[0].count})`
                    : "No tagged booking source has been recorded yet."}
                </p>
                <Link
                  href="/dashboard/marketing"
                  className="block rounded-2xl border border-[var(--border)] px-4 py-3 font-semibold text-[var(--forest)]"
                >
                  Open marketing insights
                </Link>
              </div>
            </article>
          ) : (
            <article className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
                Trust in practice
              </p>
              <div className="mt-4 space-y-3 text-sm leading-7 text-[var(--foreground)]">
                <p className="rounded-2xl border border-[var(--border)] px-4 py-3">
                  Reviews, disputes, and moderation history now shape how other users see your account.
                </p>
                <p className="rounded-2xl border border-[var(--border)] px-4 py-3">
                  Clear booking communication and low cancellation rates help your trust profile more than promotional copy.
                </p>
                <p className="rounded-2xl border border-[var(--border)] px-4 py-3">
                  Your reviews and practical experience posts become trust signals for other hunters and fishers.
                </p>
              </div>
            </article>
          )}
        </section>

        <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
          <section className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
              Next onboarding tasks
            </p>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-[var(--foreground)]">
              {completion.fields.map((field) => (
                <li
                  key={field.key}
                  className="rounded-2xl border border-[var(--border)] px-4 py-3"
                >
                  {field.complete ? "Complete" : "Needed"}: {field.label}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
              What comes next
            </p>
            <div className="mt-4 space-y-3 text-sm leading-7 text-[var(--foreground)]">
              <p className="rounded-2xl border border-[var(--border)] px-4 py-3">
                Add role-specific onboarding after this shared profile layer.
              </p>
              {user.role === UserRole.LANDOWNER ? (
                <>
                  <p className="rounded-2xl border border-[var(--border)] px-4 py-3">
                    Landowners should move into property creation and listing setup.
                  </p>
                  <p className="rounded-2xl border border-[var(--border)] px-4 py-3">
                    After the boundary step, create a listing draft and submit it for review.
                  </p>
                  <p className="rounded-2xl border border-[var(--border)] px-4 py-3">
                    Watch booking requests in the bookings workspace and respond quickly.
                  </p>
                </>
              ) : (
                <>
                  <p className="rounded-2xl border border-[var(--border)] px-4 py-3">
                    Hunters should move into qualification, discovery, and booking readiness.
                  </p>
                  <p className="rounded-2xl border border-[var(--border)] px-4 py-3">
                    Use published listings to request trips, then track approvals from the bookings page.
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
