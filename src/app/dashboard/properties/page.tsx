import { auth } from "@/auth";
import { formatPropertyStatus, formatTerrainTypes, getPropertyCompletionState } from "@/lib/property-view";
import { formatListingStatus } from "@/lib/listing-view";
import { getPropertyBoundaryStatus } from "@/lib/property-boundary-status";
import { prisma } from "@/lib/prisma";
import { summarizeAttributedBookings } from "@/lib/share-attribution";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function PropertiesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login?callbackUrl=/dashboard/properties");
  }

  const properties = await prisma.property.findMany({
    where: {
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
    orderBy: {
      createdAt: "desc",
    },
  });
  const marketingSummary = summarizeAttributedBookings(
    await prisma.booking.findMany({
      where: {
        listing: {
          property: {
            ownerId: session.user.id,
          },
        },
      },
      select: {
        hunterAttestations: true,
      },
    }),
  );
  const attributedBookings = marketingSummary.lastTouch.reduce((sum, item) => sum + item.count, 0);

  return (
    <main className="px-6 py-10 sm:px-8 md:px-10">
      <section className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--amber)]">
              My properties
            </p>
            <h1 className="mt-3 text-4xl leading-tight text-[var(--forest)] sm:text-5xl">
              Keep each property moving one calm step at a time.
            </h1>
            <p className="mt-4 text-lg leading-8 text-[var(--muted)]">
              Drafts, boundary work, and future listing setup now have a dedicated workspace instead of living only on the dashboard.
            </p>
          </div>

          <Link
            href="/dashboard/properties/new"
            className="rounded-full bg-[var(--forest)] px-5 py-3 text-sm font-semibold text-[var(--background)]"
          >
            Add another property
          </Link>
        </div>

        <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <article className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
              Marketing summary
            </p>
            <p className="mt-4 text-3xl text-[var(--forest)]">
              {attributedBookings} attributed booking request{attributedBookings === 1 ? "" : "s"}
            </p>
            <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
              The first tagged marketing view now aggregates across your listings, so you can see whether your own sharing is starting to convert.
            </p>
            <div className="mt-4">
              <Link
                href="/dashboard/marketing"
                className="inline-flex rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--forest)]"
              >
                Open marketing insights
              </Link>
            </div>
          </article>
          <article className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
              Top latest sources
            </p>
            <div className="mt-4 space-y-3 text-sm leading-7 text-[var(--foreground)]">
              {marketingSummary.lastTouch.length > 0 ? (
                marketingSummary.lastTouch.slice(0, 3).map((item) => (
                  <div key={item.key} className="rounded-2xl border border-[var(--border)] px-4 py-3">
                    <span className="font-semibold">{item.label}</span>: {item.count} booking request{item.count === 1 ? "" : "s"}
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-[var(--border)] px-4 py-3 text-[var(--muted)]">
                  No tagged share source has been recorded yet.
                </div>
              )}
            </div>
          </article>
        </div>

        {properties.length === 0 ? (
          <div className="rounded-[1.8rem] border border-[var(--border)] bg-white/75 p-8">
            <p className="text-lg leading-8 text-[var(--muted)]">
              You do not have any property drafts yet. Start with the guided draft flow, then return here to continue each property.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {(
              await Promise.all(
                properties.map(async (property) => {
                  const hasBoundary = await getPropertyBoundaryStatus(property.id, session.user.id);

                  return {
                    property,
                    completion: getPropertyCompletionState({
                      ...property,
                      boundary: hasBoundary ? {} : null,
                      centerPoint: hasBoundary ? {} : null,
                    }),
                  };
                }),
              )
            ).map(({ property, completion }) => {

              return (
                <Link
                  key={property.id}
                  href={`/dashboard/properties/${property.id}`}
                  className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6 transition hover:-translate-y-0.5 hover:bg-white"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--amber)]">
                    {formatPropertyStatus(property.status)}
                  </p>
                  <h2 className="mt-3 text-2xl text-[var(--forest)]">{property.cadastralRef}</h2>
                  <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                    {property.municipality}, {property.county} · {property.areaHectares} hectares
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                    {formatTerrainTypes(property.terrainTypes)}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                    Listing: {property.listings[0] ? formatListingStatus(property.listings[0].status) : "Not created yet"}
                  </p>
                  <div className="mt-5 h-3 rounded-full bg-[#e7e1d5]">
                    <div
                      className="h-3 rounded-full bg-[var(--amber)]"
                      style={{ width: `${completion.percent}%` }}
                    />
                  </div>
                  <p className="mt-3 text-sm text-[var(--foreground)]">
                    {completion.completed} of {completion.total} setup steps complete
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
