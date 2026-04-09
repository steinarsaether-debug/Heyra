import { UserRole } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { hasRole } from "@/lib/access";
import { formatListingStatus } from "@/lib/listing-view";
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
              Markedsføring
            </p>
            <h1 className="mt-3 text-4xl leading-tight text-[var(--forest)] sm:text-5xl">
              Se hvilke delte annonser som faktisk skaper etterspørsel.
            </h1>
            <p className="mt-4 text-lg leading-8 text-[var(--muted)]">
              Dette er den første markedsoversikten på tvers av annonser. Den fokuserer på attribuerte bestillingsforespørsler fremfor rå trafikk, slik at signalet ligger nærmere faktisk forretningsverdi.
            </p>
          </div>

          <Link
            href="/dashboard/properties"
            className="rounded-full border border-[var(--border)] px-5 py-3 text-sm font-semibold text-[var(--foreground)]"
          >
            Tilbake til eiendommer
          </Link>
        </div>

        <div className="grid gap-4 lg:grid-cols-4">
          <article className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
              Annonser
            </p>
            <p className="mt-3 text-2xl text-[var(--forest)]">{listings.length}</p>
          </article>
          <article className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
              Attribuerte forespørsler
            </p>
            <p className="mt-3 text-2xl text-[var(--forest)]">{attributedBookings}</p>
          </article>
          <article className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
              Siste kilder
            </p>
            <p className="mt-3 text-2xl text-[var(--forest)]">{overallSummary.lastTouch.length}</p>
          </article>
          <article className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
              Attribuert delingsrate
            </p>
            <p className="mt-3 text-2xl text-[var(--forest)]">{attributedRate}%</p>
          </article>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
              Første berøringspunkt på tvers av annonser
            </p>
            <div className="mt-4 space-y-3 text-sm leading-7 text-[var(--foreground)]">
              {overallSummary.firstTouch.length > 0 ? (
                overallSummary.firstTouch.map((item) => (
                  <div key={item.key} className="rounded-2xl border border-[var(--border)] px-4 py-3">
                    <span className="font-semibold">{item.label}</span>: {item.count} bestillingsforespørsel{item.count === 1 ? "" : "er"}
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-[var(--border)] px-4 py-3 text-[var(--muted)]">
                  Ingen førsteberørings-attribusjon er registrert ennå.
                </div>
              )}
            </div>
          </article>

          <article className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
              Siste berøringspunkt på tvers av annonser
            </p>
            <div className="mt-4 space-y-3 text-sm leading-7 text-[var(--foreground)]">
              {overallSummary.lastTouch.length > 0 ? (
                overallSummary.lastTouch.map((item) => (
                  <div key={item.key} className="rounded-2xl border border-[var(--border)] px-4 py-3">
                    <span className="font-semibold">{item.label}</span>: {item.count} bestillingsforespørsel{item.count === 1 ? "" : "er"}
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-[var(--border)] px-4 py-3 text-[var(--muted)]">
                  Ingen attribusjon for siste berøringspunkt er registrert ennå.
                </div>
              )}
            </div>
          </article>
        </div>

        <article className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
            Veiledning for deling
          </p>
          <div className="mt-4 grid gap-3 text-sm leading-7 text-[var(--foreground)] lg:grid-cols-3">
            <div className="rounded-2xl border border-[var(--border)] px-4 py-3">
              Bruk kampanjeforslagene fra hver annonseflate når du deler i eget nettverk, Facebook-grupper eller til tidligere gjester. Det gir renere attribusjon.
            </div>
            <div className="rounded-2xl border border-[var(--border)] px-4 py-3">
              Bruk helst det merkevarede forhåndsvisningsbildet når du publiserer manuelt. Det gir annonsen en jevn visuell identitet også når plattformen ikke lager kortet automatisk.
            </div>
            <div className="rounded-2xl border border-[var(--border)] px-4 py-3">
              Følg attribuert delingsrate over tid, ikke bare rått antall bestillinger. Lav rate kan bety at publikumet er bredt, men ikke godt nok tilpasset annonsen.
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
                      {formatListingStatus(listing.status)}
                    </p>
                    <h2 className="mt-3 text-2xl text-[var(--forest)]">{listing.title}</h2>
                    <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                      {listing.property.cadastralRef} · {listing.property.municipality}
                    </p>
                    <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                      {listingAttributedBookings} attribuert bestillingsforespørsel{listingAttributedBookings === 1 ? "" : "er"}
                    </p>
                    <p className="mt-1 text-sm leading-7 text-[var(--muted)]">
                      Attribuert delingsrate: {listingShareRate}% av {listing.bookings.length} bestillingsforespørsel{listing.bookings.length === 1 ? "" : "er"}
                    </p>
                    <p className="mt-1 text-sm leading-7 text-[var(--muted)]">
                      {summary.lastTouch[0]
                        ? `Viktigste siste kilde: ${summary.lastTouch[0].label}`
                        : "Ingen tagget kilde er registrert ennå"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Link
                      href={`/dashboard/properties/${listing.property.id}/listing`}
                      className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--forest)]"
                    >
                      Annonseflate
                    </Link>
                    <Link
                      href={`/dashboard/properties/${listing.property.id}/insights`}
                      className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--forest)]"
                    >
                      Eiendomsinnsikt
                    </Link>
                    {listing.slug ? (
                      <Link
                        href={`/listings/${listing.slug}`}
                        className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--forest)]"
                      >
                        Offentlig annonse
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
