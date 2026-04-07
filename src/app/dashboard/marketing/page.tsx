import { UserRole } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { hasRole } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { summarizeAttributedBookings } from "@/lib/share-attribution";

export default async function MarketingPage() {
  const session = await auth();

  if (!session?.user || !hasRole(session, [UserRole.LANDOWNER, UserRole.ADMIN])) {
    redirect("/dashboard");
  }

  const listings = await prisma.listing.findMany({
    where: {
      property: {
        ownerId: session.user.id,
      },
    },
    select: {
      id: true,
      slug: true,
      title: true,
      status: true,
      property: {
        select: {
          id: true,
          cadastralRef: true,
          municipality: true,
        },
      },
      bookings: {
        select: {
          hunterAttestations: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  const overallSummary = summarizeAttributedBookings(
    listings.flatMap((listing) => listing.bookings),
  );
  const attributedBookings = overallSummary.lastTouch.reduce((sum, item) => sum + item.count, 0);
  const attributedRate = listings.flatMap((listing) => listing.bookings).length
    ? Math.round((attributedBookings / listings.flatMap((listing) => listing.bookings).length) * 100)
    : 0;

  return (
    <main className="px-6 py-10 sm:px-8 md:px-10">
      <section className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--amber)]">
              Marketing
            </p>
            <h1 className="mt-3 text-4xl leading-tight text-[var(--forest)] sm:text-5xl">
              See which shared listings are creating real demand.
            </h1>
            <p className="mt-4 text-lg leading-8 text-[var(--muted)]">
              This is the first cross-listing marketing view. It focuses on attributed booking requests rather than raw traffic, so the signal stays closer to actual business value.
            </p>
          </div>

          <Link
            href="/dashboard/properties"
            className="rounded-full border border-[var(--border)] px-5 py-3 text-sm font-semibold text-[var(--foreground)]"
          >
            Back to properties
          </Link>
        </div>

        <div className="grid gap-4 lg:grid-cols-4">
          <article className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
              Listings
            </p>
            <p className="mt-3 text-2xl text-[var(--forest)]">{listings.length}</p>
          </article>
          <article className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
              Attributed requests
            </p>
            <p className="mt-3 text-2xl text-[var(--forest)]">{attributedBookings}</p>
          </article>
          <article className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
              Latest sources
            </p>
            <p className="mt-3 text-2xl text-[var(--forest)]">{overallSummary.lastTouch.length}</p>
          </article>
          <article className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
              Attributed share rate
            </p>
            <p className="mt-3 text-2xl text-[var(--forest)]">{attributedRate}%</p>
          </article>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
              First touch across listings
            </p>
            <div className="mt-4 space-y-3 text-sm leading-7 text-[var(--foreground)]">
              {overallSummary.firstTouch.length > 0 ? (
                overallSummary.firstTouch.map((item) => (
                  <div key={item.key} className="rounded-2xl border border-[var(--border)] px-4 py-3">
                    <span className="font-semibold">{item.label}</span>: {item.count} booking request{item.count === 1 ? "" : "s"}
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-[var(--border)] px-4 py-3 text-[var(--muted)]">
                  No first-touch attribution has been recorded yet.
                </div>
              )}
            </div>
          </article>

          <article className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
              Last touch across listings
            </p>
            <div className="mt-4 space-y-3 text-sm leading-7 text-[var(--foreground)]">
              {overallSummary.lastTouch.length > 0 ? (
                overallSummary.lastTouch.map((item) => (
                  <div key={item.key} className="rounded-2xl border border-[var(--border)] px-4 py-3">
                    <span className="font-semibold">{item.label}</span>: {item.count} booking request{item.count === 1 ? "" : "s"}
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-[var(--border)] px-4 py-3 text-[var(--muted)]">
                  No last-touch attribution has been recorded yet.
                </div>
              )}
            </div>
          </article>
        </div>

        <article className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
            Posting guidance
          </p>
          <div className="mt-4 grid gap-3 text-sm leading-7 text-[var(--foreground)] lg:grid-cols-3">
            <div className="rounded-2xl border border-[var(--border)] px-4 py-3">
              Use the campaign presets from each listing workspace when you post to your own network, Facebook groups, or returning guests. That keeps the attribution cleaner.
            </div>
            <div className="rounded-2xl border border-[var(--border)] px-4 py-3">
              Prefer the branded preview image when posting manually. It gives the listing a consistent visual identity even if the platform does not generate the card automatically.
            </div>
            <div className="rounded-2xl border border-[var(--border)] px-4 py-3">
              Watch attributed share rate over time instead of only raw booking count. Low rate can mean the audience is broad but not well matched to the listing.
            </div>
          </div>
        </article>

        <div className="grid gap-4">
          {listings.map((listing) => {
            const summary = summarizeAttributedBookings(listing.bookings);
            const listingAttributedBookings = summary.lastTouch.reduce((sum, item) => sum + item.count, 0);
            const listingShareRate = listing.bookings.length
              ? Math.round((listingAttributedBookings / listing.bookings.length) * 100)
              : 0;

            return (
              <article
                key={listing.id}
                className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--amber)]">
                      {listing.status.toLowerCase()}
                    </p>
                    <h2 className="mt-3 text-2xl text-[var(--forest)]">{listing.title}</h2>
                    <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                      {listing.property.cadastralRef} · {listing.property.municipality}
                    </p>
                    <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                      {listingAttributedBookings} attributed booking request{listingAttributedBookings === 1 ? "" : "s"}
                    </p>
                    <p className="mt-1 text-sm leading-7 text-[var(--muted)]">
                      Attributed share rate: {listingShareRate}% of {listing.bookings.length} booking request{listing.bookings.length === 1 ? "" : "s"}
                    </p>
                    <p className="mt-1 text-sm leading-7 text-[var(--muted)]">
                      {summary.lastTouch[0]
                        ? `Top latest source: ${summary.lastTouch[0].label}`
                        : "No tagged source recorded yet"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Link
                      href={`/dashboard/properties/${listing.property.id}/listing`}
                      className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--forest)]"
                    >
                      Listing workspace
                    </Link>
                    <Link
                      href={`/dashboard/properties/${listing.property.id}/insights`}
                      className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--forest)]"
                    >
                      Property insights
                    </Link>
                    {listing.slug ? (
                      <Link
                        href={`/listings/${listing.slug}`}
                        className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--forest)]"
                      >
                        Public listing
                      </Link>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
