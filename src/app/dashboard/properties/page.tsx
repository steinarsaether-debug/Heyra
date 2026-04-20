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
        <div className="overflow-hidden rounded-[2rem] border border-[rgba(16,42,33,0.1)] bg-[rgba(255,251,245,0.92)] shadow-[0_28px_80px_rgba(16,42,33,0.12)] backdrop-blur-sm">
          <div className="bg-[linear-gradient(135deg,rgba(10,25,22,0.96),rgba(27,58,44,0.88))] px-8 py-10 text-white">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/65">
              Eiendommer
            </p>
            <h1 className="mt-3 text-4xl leading-tight sm:text-5xl">
              Hold hver eiendom i bevegelse, ett rolig steg av gangen.
            </h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-white/75">
              Utkast, grensearbeid og annonseoppsett har nå egne arbeidsflater i stedet for å ligge spredt på oversikten.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[rgba(16,42,33,0.08)] bg-[linear-gradient(180deg,rgba(255,252,246,0.96),rgba(245,239,229,0.94))] px-8 py-6">
            <div className="flex flex-wrap gap-3 text-sm text-[var(--muted)]">
              <span className="rounded-full border border-[rgba(16,42,33,0.12)] bg-white/80 px-4 py-2 font-semibold text-[var(--forest)]">
                {properties.length} eiendom{properties.length === 1 ? "" : "mer"}
              </span>
              <span className="rounded-full border border-[rgba(16,42,33,0.08)] bg-white/65 px-4 py-2">
                {attributedBookings} attribuerte forespørsler
              </span>
            </div>
            <Link
              href="/dashboard/properties/new"
              className="rounded-full bg-[var(--forest)] px-5 py-3 text-sm font-semibold text-[var(--background)] transition hover:-translate-y-0.5"
            >
              Legg til eiendom
            </Link>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <article className="rounded-[1.8rem] border border-[rgba(16,42,33,0.08)] bg-[linear-gradient(180deg,rgba(255,252,246,0.94),rgba(245,239,229,0.86))] p-6 shadow-[0_18px_44px_rgba(16,42,33,0.07)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
              Markedsføringssammendrag
            </p>
            <p className="mt-4 text-3xl text-[var(--forest)]">
              {attributedBookings} attribuert bestillingsforespørsel{attributedBookings === 1 ? "" : "er"}
            </p>
            <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
              Den første taggede markedsføringsvisningen summerer nå på tvers av annonsene dine, så du ser om deling i eget nettverk faktisk begynner å gi effekt.
            </p>
            <div className="mt-4">
              <Link
                href="/dashboard/marketing"
                className="inline-flex rounded-full border border-[rgba(16,42,33,0.12)] bg-white/85 px-4 py-2 text-sm font-semibold text-[var(--forest)] transition hover:-translate-y-0.5 hover:bg-white"
              >
                Åpne markedsinnsikt
              </Link>
            </div>
          </article>
          <article className="rounded-[1.8rem] border border-[rgba(16,42,33,0.08)] bg-[linear-gradient(180deg,rgba(255,252,246,0.94),rgba(245,239,229,0.86))] p-6 shadow-[0_18px_44px_rgba(16,42,33,0.07)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
              Viktigste siste kilder
            </p>
            <div className="mt-4 space-y-3 text-sm leading-7 text-[var(--foreground)]">
              {marketingSummary.lastTouch.length > 0 ? (
                marketingSummary.lastTouch.slice(0, 3).map((item) => (
                  <div key={item.key} className="rounded-[1.25rem] border border-[rgba(16,42,33,0.08)] bg-white/72 px-4 py-3">
                    <span className="font-semibold">{item.label}</span>: {item.count} bestillingsforespørsel{item.count === 1 ? "" : "er"}
                  </div>
                ))
              ) : (
                <div className="rounded-[1.25rem] border border-[rgba(16,42,33,0.08)] bg-white/72 px-4 py-3 text-[var(--muted)]">
                  Ingen tagget delingskilde er registrert ennå.
                </div>
              )}
            </div>
          </article>
        </div>

        {properties.length === 0 ? (
          <div className="rounded-[1.8rem] border border-[rgba(16,42,33,0.08)] bg-[rgba(255,251,245,0.82)] p-8 shadow-[0_18px_40px_rgba(16,42,33,0.06)]">
            <p className="text-lg leading-8 text-[var(--muted)]">
              Du har ingen eiendomsutkast ennå. Start med den guidede opprettelsen, og kom tilbake hit for å jobbe videre med hver eiendom.
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
                  className="rounded-[1.8rem] border border-[rgba(16,42,33,0.08)] bg-[linear-gradient(180deg,rgba(255,252,246,0.94),rgba(245,239,229,0.86))] p-6 shadow-[0_18px_44px_rgba(16,42,33,0.07)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_52px_rgba(16,42,33,0.09)]"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--amber)]">
                    {formatPropertyStatus(property.status)}
                  </p>
                  <h2 className="mt-3 text-2xl text-[var(--forest)]">{property.cadastralRef}</h2>
                  <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                    {property.municipality}, {property.county} · {property.areaHectares} hektar
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                    {formatTerrainTypes(property.terrainTypes)}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                    Annonse: {property.listings[0] ? formatListingStatus(property.listings[0].status) : "Ikke opprettet ennå"}
                  </p>
                  <div className="mt-5 h-3 rounded-full bg-[#e7e1d5]">
                    <div
                      className="h-3 rounded-full bg-[var(--amber)]"
                      style={{ width: `${completion.percent}%` }}
                    />
                  </div>
                  <p className="mt-3 text-sm text-[var(--foreground)]">
                    {completion.completed} av {completion.total} oppsettsteg fullført
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
