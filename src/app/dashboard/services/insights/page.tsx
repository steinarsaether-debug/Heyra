import { UserRole } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { hasRole } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { formatServiceCategory } from "@/lib/service-view";

export default async function ServiceInsightsPage() {
  const session = await auth();

  if (!session?.user || !hasRole(session, [UserRole.LANDOWNER, UserRole.HUNTER, UserRole.ADMIN])) {
    redirect("/dashboard");
  }

  const isAdmin = hasRole(session, [UserRole.ADMIN]);
  const profileFilter = isAdmin
    ? {}
    : {
        providerProfile: {
          userId: session.user.id,
        },
      };

  const services = await prisma.serviceListing.findMany({
    where: profileFilter,
    include: {
      providerProfile: {
        select: {
          businessName: true,
          reviewStatus: true,
        },
      },
    },
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
  });

  const listingsWithNearbyServices = await prisma.listing.findMany({
    where: {
      status: "PUBLISHED",
      property: {
        OR: [
          {
            municipality: {
              in: [...new Set(services.map((service) => service.municipality))],
            },
          },
          {
            county: {
              in: [...new Set(services.map((service) => service.county))],
            },
          },
        ],
      },
    },
    select: {
      id: true,
    },
  });

  const categorySummary = Object.values(
    services.reduce<Record<string, { label: string; count: number }>>((accumulator, service) => {
      const key = service.category;
      const existing = accumulator[key];
      accumulator[key] = {
        label: formatServiceCategory(service.category),
        count: (existing?.count ?? 0) + 1,
      };
      return accumulator;
    }, {}),
  ).sort((left, right) => right.count - left.count);

  const approvedProviders = new Set(
    services
      .filter((service) => service.providerProfile.reviewStatus === "APPROVED")
      .map((service) => service.providerProfile.businessName),
  ).size;

  return (
    <main className="px-6 py-10 sm:px-8 md:px-10">
      <section className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--amber)]">
              Tjenesteinnsikt
            </p>
            <h1 className="mt-3 text-4xl leading-tight text-[var(--forest)] sm:text-5xl">
              Følg markedsdekningen før lansering.
            </h1>
            <p className="mt-4 text-lg leading-8 text-[var(--muted)]">
              Denne visningen er laget for lanseringsberedskap, ikke annonseanalyse. Den svarer på om tjenestelaget er bredt nok, godt nok gjennomgått og nær nok aktive områder.
            </p>
          </div>

          <Link
            href="/dashboard/services"
            className="rounded-full border border-[var(--border)] px-5 py-3 text-sm font-semibold text-[var(--foreground)]"
          >
            Tilbake til tjenester
          </Link>
        </div>

        <div className="grid gap-4 lg:grid-cols-4">
          <article className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
              Tjenester
            </p>
            <p className="mt-3 text-2xl text-[var(--forest)]">{services.length}</p>
          </article>
          <article className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
              Publisert
            </p>
            <p className="mt-3 text-2xl text-[var(--forest)]">
              {services.filter((service) => service.status === "PUBLISHED").length}
            </p>
          </article>
          <article className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
              Gjennomgåtte leverandører
            </p>
            <p className="mt-3 text-2xl text-[var(--forest)]">{approvedProviders}</p>
          </article>
          <article className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
              Nærdekning
            </p>
            <p className="mt-3 text-2xl text-[var(--forest)]">{listingsWithNearbyServices.length}</p>
          </article>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
              Kategoridekning
            </p>
            <div className="mt-4 space-y-3 text-sm leading-7 text-[var(--foreground)]">
              {categorySummary.length > 0 ? (
                categorySummary.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-[var(--border)] px-4 py-3">
                    <span className="font-semibold">{item.label}</span>: {item.count}
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-[var(--border)] px-4 py-3 text-[var(--muted)]">
                  Ingen tjenester ennå.
                </div>
              )}
            </div>
          </article>

          <article className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
              Vurdering av lanseringsberedskap
            </p>
            <div className="mt-4 space-y-3 text-sm leading-7 text-[var(--foreground)]">
              <div className="rounded-2xl border border-[var(--border)] px-4 py-3">
                Gjennomgåtte leverandører bør dekke mer enn én kategori før tilliten til Norges-lanseringen er høy.
              </div>
              <div className="rounded-2xl border border-[var(--border)] px-4 py-3">
                Nærdekning betyr mer enn totalantall. Målet er praktisk nytte rundt publiserte annonser, ikke en stor tom katalog.
              </div>
              <div className="rounded-2xl border border-[var(--border)] px-4 py-3">
                Tjenesteanmeldelser er bevisst utsatt til det finnes en reell modell for tjenestebestilling eller sammenslått kjøp.
              </div>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
