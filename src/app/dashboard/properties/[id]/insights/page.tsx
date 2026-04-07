import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { canManageProperties } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { summarizeAttributedBookings } from "@/lib/share-attribution";

export default async function PropertyInsightsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();

  if (!canManageProperties(session)) {
    redirect("/dashboard");
  }

  const { id } = await params;
  const property = await prisma.property.findFirst({
    where: {
      id,
      ownerId: session.user.id,
    },
    include: {
      listings: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
    },
  });

  if (!property) {
    redirect("/dashboard/properties");
  }

  const listing = property.listings[0] ?? null;

  if (!listing) {
    redirect(`/dashboard/properties/${property.id}/listing`);
  }

  const bookings = await prisma.booking.findMany({
    where: {
      listingId: listing.id,
    },
    select: {
      id: true,
      status: true,
      createdAt: true,
      hunterAttestations: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const attributionSummary = summarizeAttributedBookings(bookings);
  const attributedBookingCount = attributionSummary.lastTouch.reduce((sum, item) => sum + item.count, 0);

  return (
    <main className="px-6 py-10 sm:px-8 md:px-10">
      <section className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--amber)]">
              Promotion insights
            </p>
            <h1 className="mt-3 text-4xl leading-tight text-[var(--forest)] sm:text-5xl">
              {listing.title}
            </h1>
            <p className="mt-4 text-lg leading-8 text-[var(--muted)]">
              This first version compares where an attributed booking first came from and the latest shared touch we saw before the request was sent.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/dashboard/properties/${property.id}/listing`}
              className="rounded-full border border-[var(--border)] px-5 py-3 text-sm font-semibold text-[var(--foreground)]"
            >
              Back to listing
            </Link>
            <Link
              href={`/dashboard/properties/${property.id}`}
              className="rounded-full border border-[var(--border)] px-5 py-3 text-sm font-semibold text-[var(--foreground)]"
            >
              Back to property
            </Link>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <article className="rounded-[1.5rem] border border-[var(--border)] bg-white/75 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
              Total bookings
            </p>
            <p className="mt-3 text-2xl text-[var(--forest)]">{bookings.length}</p>
          </article>
          <article className="rounded-[1.5rem] border border-[var(--border)] bg-white/75 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
              Attributed bookings
            </p>
            <p className="mt-3 text-2xl text-[var(--forest)]">{attributedBookingCount}</p>
          </article>
          <article className="rounded-[1.5rem] border border-[var(--border)] bg-white/75 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
              Tagged sources
            </p>
            <p className="mt-3 text-2xl text-[var(--forest)]">{attributionSummary.lastTouch.length}</p>
          </article>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
              First touch
            </p>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
              The first tagged share source stored for the booking journey on this device.
            </p>
            <div className="mt-4 space-y-3">
              {attributionSummary.firstTouch.length > 0 ? (
                attributionSummary.firstTouch.map((item) => (
                  <div
                    key={item.key}
                    className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm leading-7 text-[var(--foreground)]"
                  >
                    <span className="font-semibold">{item.label}</span>: {item.count} booking request{item.count === 1 ? "" : "s"}
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm leading-7 text-[var(--muted)]">
                  No first-touch attribution has been recorded yet.
                </div>
              )}
            </div>
          </article>

          <article className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
              Last touch
            </p>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
              The most recent tagged share source seen before the booking request was submitted.
            </p>
            <div className="mt-4 space-y-3">
              {attributionSummary.lastTouch.length > 0 ? (
                attributionSummary.lastTouch.map((item) => (
                  <div
                    key={item.key}
                    className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm leading-7 text-[var(--foreground)]"
                  >
                    <span className="font-semibold">{item.label}</span>: {item.count} booking request{item.count === 1 ? "" : "s"}
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm leading-7 text-[var(--muted)]">
                  No last-touch attribution has been recorded yet.
                </div>
              )}
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
