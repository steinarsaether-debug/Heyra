import type { Metadata } from "next";
import Link from "next/link";
import { PublicServiceCard } from "@/components/services/public-service-card";
import { formatServiceCategory } from "@/lib/service-view";
import { prisma } from "@/lib/prisma";
import { absoluteUrl } from "@/lib/site";
import { parseServiceCategory, serviceCategoryOptions } from "@/lib/service-constants";

export const revalidate = 300;

type ServicesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Tjenester",
    description: "Finn trygge lokale tjenester i nærheten av jakt- og fisketurer i Norge.",
    alternates: {
      canonical: absoluteUrl("/services"),
    },
  };
}

export default async function ServicesPage({ searchParams }: ServicesPageProps) {
  const rawParams = searchParams ? await searchParams : {};
  const q = (Array.isArray(rawParams.q) ? rawParams.q[0] : rawParams.q)?.trim() ?? "";
  const categoryValue = (Array.isArray(rawParams.category) ? rawParams.category[0] : rawParams.category) ?? "";
  const municipality = (Array.isArray(rawParams.municipality) ? rawParams.municipality[0] : rawParams.municipality)?.trim() ?? "";
  const category = parseServiceCategory(categoryValue);

  const services = await prisma.serviceListing.findMany({
    where: {
      status: "PUBLISHED",
      ...(category ? { category } : {}),
      ...(municipality
        ? {
            municipality: {
              contains: municipality,
              mode: "insensitive",
            },
          }
        : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
              {
                providerProfile: {
                  businessName: {
                    contains: q,
                    mode: "insensitive",
                  },
                },
              },
            ],
          }
        : {}),
    },
    include: {
      providerProfile: {
        select: {
          businessName: true,
          reviewStatus: true,
          verifiedAt: true,
          yearsExperience: true,
          services: {
            select: {
              id: true,
            },
            where: {
              status: "PUBLISHED",
            },
          },
        },
      },
    },
    orderBy: [{ municipality: "asc" }, { updatedAt: "desc" }],
  });
  const featuredServices = services.slice(0, 3);

  return (
    <main className="px-4 py-5 sm:px-6 sm:py-6 md:px-8">
      <section className="space-y-8">
        <div className="overflow-hidden rounded-[2rem] border border-[rgba(16,42,33,0.1)] bg-[rgba(255,251,245,0.9)] shadow-[0_24px_80px_rgba(16,42,33,0.08)] backdrop-blur-sm">
          <div className="heyra-services-hero border-b border-[rgba(16,42,33,0.08)] px-5 py-8 sm:px-8 sm:py-10 lg:px-10">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--orange)]">
                Tjenester
              </p>
              <h1 className="mt-3 text-4xl leading-tight text-[var(--forest)] sm:text-5xl">
                Finn lokal hjelp du faktisk vil bygge turen rundt.
              </h1>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-[var(--muted)]">
                Tjenestelaget skal ikke bare vaere et tillegg. Det skal gjoere transport, opphold, hundefoerere og etterarbeid like lette a finne som selve turen.
              </p>
            </div>
          </div>

          <div className="bg-[#fcfaf6] px-4 py-4 sm:px-6 lg:px-8">
            <form className="grid gap-3 rounded-[1.5rem] border border-[rgba(16,42,33,0.08)] bg-white/92 p-4 text-sm text-[var(--muted)] shadow-[0_16px_32px_rgba(16,42,33,0.04)] sm:grid-cols-2 xl:grid-cols-4">
              <input
                type="search"
                name="q"
                defaultValue={q}
                placeholder="Søk etter tilbyder eller tjeneste"
                className="rounded-[1rem] border border-[rgba(16,42,33,0.1)] bg-[#fffdfa] px-4 py-3 text-[var(--foreground)] outline-none xl:col-span-2"
              />
              <select
                name="category"
                defaultValue={category ?? ""}
                className="rounded-[1rem] border border-[rgba(16,42,33,0.1)] bg-[#fffdfa] px-4 py-3 text-[var(--foreground)] outline-none"
              >
                <option value="">Alle kategorier</option>
                {serviceCategoryOptions.map((item) => (
                  <option key={item} value={item}>
                    {formatServiceCategory(item)}
                  </option>
                ))}
              </select>
              <input
                type="text"
                name="municipality"
                defaultValue={municipality}
                placeholder="Kommune"
                className="rounded-[1rem] border border-[rgba(16,42,33,0.1)] bg-[#fffdfa] px-4 py-3 text-[var(--foreground)] outline-none"
              />
              <div className="flex flex-wrap gap-3 sm:col-span-2 xl:col-span-4">
                <button
                  type="submit"
                  className="rounded-full bg-[var(--orange)] px-5 py-3 font-semibold text-white shadow-[0_14px_28px_rgba(245,106,20,0.2)]"
                >
                  Oppdater søk
                </button>
                <Link
                  href="/services"
                  className="rounded-full border border-[rgba(16,42,33,0.12)] bg-white px-5 py-3 font-semibold text-[var(--foreground)]"
                >
                  Nullstill filtre
                </Link>
              </div>
            </form>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-4">
          <article className="rounded-[1.6rem] border border-[rgba(16,42,33,0.08)] bg-[rgba(255,255,255,0.86)] p-6 shadow-[0_16px_35px_rgba(16,42,33,0.05)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
              Tjenester
            </p>
            <p className="mt-3 text-3xl text-[var(--forest)]">{services.length}</p>
            <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
              Publiserte tjenester som matcher det aktive soket.
            </p>
          </article>
          <article className="rounded-[1.6rem] border border-[rgba(16,42,33,0.08)] bg-[rgba(255,255,255,0.86)] p-6 shadow-[0_16px_35px_rgba(16,42,33,0.05)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
              Kategori
            </p>
            <p className="mt-3 text-3xl text-[var(--forest)]">
              {category ? formatServiceCategory(category) : "Alle"}
            </p>
            <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
              Filtrer pa hundefoerere, transport, opphold og etterarbeid.
            </p>
          </article>
          <article className="rounded-[1.6rem] border border-[rgba(16,42,33,0.08)] bg-[rgba(255,255,255,0.86)] p-6 shadow-[0_16px_35px_rgba(16,42,33,0.05)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
              Omrade
            </p>
            <p className="mt-3 text-3xl text-[var(--forest)]">
              {municipality || "Hele Norge"}
            </p>
            <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
              Hold lokale tilbydere tett pa turen og logistikken rundt den.
            </p>
          </article>
          <article className="rounded-[1.6rem] border border-[rgba(16,42,33,0.08)] bg-[rgba(255,255,255,0.86)] p-6 shadow-[0_16px_35px_rgba(16,42,33,0.05)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
              Bruk
            </p>
            <p className="mt-3 text-3xl text-[var(--forest)]">Planlegg</p>
            <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
              Bruk tjenestelaget for a samle praktiske valg rundt selve opplevelsen.
            </p>
          </article>
        </div>

        {featuredServices.length > 0 ? (
          <section className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--orange)]">
                  Utvalgte tjenester
                </p>
                <h2 className="mt-2 text-2xl text-[var(--foreground-strong)] sm:text-3xl">
                  Tjenester som ser ut som en del av reisen, ikke et vedlegg.
                </h2>
              </div>
              <p className="max-w-xl text-sm leading-7 text-[var(--muted)]">
                Fremhev de beste tilbyderne tidlig, sa browse-opplevelsen umiddelbart viser at Heyra ogsa kan lose det praktiske rundt turen.
              </p>
            </div>
            <div className="grid gap-5 xl:grid-cols-3">
              {featuredServices.map((service) => {
                return (
                  <PublicServiceCard
                    key={`featured-${service.id}`}
                    service={service}
                    variant="featured"
                  />
                );
              })}
            </div>
          </section>
        ) : null}

        {services.length === 0 ? (
          <div className="rounded-[1.7rem] border border-[rgba(16,42,33,0.08)] bg-white/82 p-8 text-base leading-8 text-[var(--muted)] shadow-[0_16px_35px_rgba(16,42,33,0.05)]">
            Ingen publiserte tjenester matcher dette søket ennå.
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
            {services.map((service) => (
              <PublicServiceCard
                key={service.id}
                service={service}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
