import { UserRole } from "@prisma/client";
import { auth } from "@/auth";
import { EmailVerificationCard } from "@/components/auth/email-verification-card";
import { ProfileForm } from "@/components/auth/profile-form";
import { getUserRoles } from "@/lib/access";
import { getProfileCompletion, getRoleGuidance } from "@/lib/profile";
import { prisma } from "@/lib/prisma";
import { getAverageRating } from "@/lib/review-view";
import { getHostQualityBadge, getTrustSummary } from "@/lib/trust-summary";
import { formatUserRoles } from "@/lib/user-status";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login?callbackUrl=/dashboard/profile");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    include: {
      pii: true,
      receivedReviews: {
        where: {
          moderationStatus: "APPROVED",
        },
        orderBy: {
          publishedAt: "desc",
        },
        take: 5,
      },
    },
  });

  if (!user) {
    redirect("/auth/login");
  }

  const completion = getProfileCompletion(user);
  const userRoles = getUserRoles(user);
  const roleLabel = formatUserRoles(userRoles);
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

  return (
    <main className="px-6 py-10 sm:px-8 md:px-10">
      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="overflow-hidden rounded-[2rem] border border-[rgba(16,42,33,0.1)] bg-[rgba(255,251,245,0.92)] shadow-[0_28px_80px_rgba(16,42,33,0.12)] backdrop-blur-sm">
            <div className="bg-[linear-gradient(135deg,rgba(10,25,22,0.96),rgba(27,58,44,0.88))] p-8 text-[var(--background)]">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-white/65">
                Profil
              </p>
              <h1 className="mt-5 text-4xl leading-tight sm:text-5xl">
                Fullfør den grunnleggende kontoprofilen din.
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-8 text-white/75">
                {getRoleGuidance(userRoles)}
              </p>
            </div>
            <div className="border-t border-[rgba(16,42,33,0.08)] bg-[linear-gradient(180deg,rgba(255,252,246,0.96),rgba(245,239,229,0.94))] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
                Fremdrift
              </p>
              <div className="mt-4 flex items-end justify-between gap-4">
                <div>
                  <p className="text-4xl text-[var(--forest)]">{completion.percent}%</p>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    {completion.completed} av {completion.total} viktige felt er fylt ut
                  </p>
                </div>
                <div className="h-3 flex-1 rounded-full bg-[#e7e1d5]">
                  <div
                    className="h-3 rounded-full bg-[var(--amber)]"
                    style={{ width: `${completion.percent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <EmailVerificationCard email={user.email} isVerified={Boolean(user.emailVerified)} />

          <div className="rounded-[1.8rem] border border-[rgba(16,42,33,0.08)] bg-[linear-gradient(180deg,rgba(255,252,246,0.94),rgba(245,239,229,0.86))] p-8 shadow-[0_18px_44px_rgba(16,42,33,0.07)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--amber)]">
              Rediger profil
            </p>
            <div className="mt-5">
              <ProfileForm
                roleLabel={roleLabel}
                initialValues={{
                  fullName: user.pii?.fullName ?? "",
                  address: user.pii?.address ?? "",
                  phone: user.pii?.phone ?? "",
                  emergencyName: user.pii?.emergencyName ?? "",
                  emergencyPhone: user.pii?.emergencyPhone ?? "",
                  hunterNumber: user.pii?.hunterNumber ?? "",
                }}
              />
            </div>
          </div>

          <div className="rounded-[1.8rem] border border-[rgba(16,42,33,0.08)] bg-[rgba(255,251,245,0.84)] p-6 shadow-[0_18px_40px_rgba(16,42,33,0.06)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
              Gjenstående profiloppgaver
            </p>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-[var(--foreground)]">
              {completion.fields.map((field) => (
                <li
                  key={field.key}
                  className="rounded-[1.25rem] border border-[rgba(16,42,33,0.08)] bg-white/72 px-4 py-3"
                >
                  {field.complete ? "Fullført" : "Mangler"}: {field.label}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-[1.8rem] border border-[rgba(16,42,33,0.08)] bg-[rgba(255,251,245,0.84)] p-6 shadow-[0_18px_40px_rgba(16,42,33,0.06)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
              Omdømme
            </p>
            <p className="mt-3 text-2xl text-[var(--forest)]">
              {averageRating ? `${averageRating.toFixed(1)} / 5` : "Ingen vurderinger ennå"}
            </p>
            <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
              {user.receivedReviews.length} godkjente vurdering{user.receivedReviews.length === 1 ? "" : "er"} mottatt
            </p>
            <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{trustSummary.detail}</p>
            {hostBadge ? (
              <p className="mt-3 inline-flex rounded-full bg-[var(--forest)] px-4 py-2 text-sm font-semibold text-white">
                {hostBadge.label}
              </p>
            ) : null}
            {user.receivedReviews.length > 0 ? (
              <div className="mt-4 space-y-3">
                {user.receivedReviews.map((review) => (
                  <div
                    key={review.id}
                    className="rounded-[1.25rem] border border-[rgba(16,42,33,0.08)] bg-white/72 px-4 py-3 text-sm leading-7 text-[var(--foreground)]"
                  >
                    <span className="font-semibold">{review.rating} / 5</span> · {review.title}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}
