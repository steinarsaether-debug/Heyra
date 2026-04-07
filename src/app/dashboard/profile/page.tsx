import { UserRole } from "@prisma/client";
import { auth } from "@/auth";
import { EmailVerificationCard } from "@/components/auth/email-verification-card";
import { ProfileForm } from "@/components/auth/profile-form";
import { getProfileCompletion, getRoleGuidance } from "@/lib/profile";
import { prisma } from "@/lib/prisma";
import { getAverageRating } from "@/lib/review-view";
import { getHostQualityBadge, getTrustSummary } from "@/lib/trust-summary";
import { redirect } from "next/navigation";

function getRoleLabel(role: UserRole) {
  if (role === UserRole.LANDOWNER) {
    return "Landowner";
  }

  if (role === UserRole.ADMIN) {
    return "Admin";
  }

  return "Hunter / Fisher";
}

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
  const roleLabel = getRoleLabel(user.role);
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

  return (
    <main className="px-6 py-10 sm:px-8 md:px-10">
      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="rounded-[1.8rem] bg-[var(--forest)] p-8 text-[var(--background)]">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-white/65">
              Profile
            </p>
            <h1 className="mt-5 text-4xl leading-tight sm:text-5xl">
              Complete your core account profile.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-white/75">
              {getRoleGuidance(user.role)}
            </p>
          </div>

          <div className="rounded-[1.6rem] border border-[var(--border)] bg-white/70 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
              Completion
            </p>
            <div className="mt-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-4xl text-[var(--forest)]">{completion.percent}%</p>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  {completion.completed} of {completion.total} core fields completed
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

        <div className="space-y-5">
          <EmailVerificationCard email={user.email} isVerified={Boolean(user.emailVerified)} />

          <div className="rounded-[1.8rem] border border-[var(--border)] bg-white/75 p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--amber)]">
              Edit profile
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

          <div className="rounded-[1.6rem] border border-[var(--border)] bg-white/70 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
              Remaining profile tasks
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
          </div>

          <div className="rounded-[1.6rem] border border-[var(--border)] bg-white/70 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
              Reputation
            </p>
            <p className="mt-3 text-2xl text-[var(--forest)]">
              {averageRating ? `${averageRating.toFixed(1)} / 5` : "No reviews yet"}
            </p>
            <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
              {user.receivedReviews.length} approved review{user.receivedReviews.length === 1 ? "" : "s"} received
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
                    className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm leading-7 text-[var(--foreground)]"
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
