import type { Metadata } from "next";
import { ServiceCategory } from "@prisma/client";
import Link from "next/link";
import { formatServiceCategory } from "@/lib/service-view";
import { prisma } from "@/lib/prisma";
import { absoluteUrl } from "@/lib/site";
import { getServiceTrustBadge, getServiceTrustSummary } from "@/lib/service-trust";
import { TrustBadge } from "@/components/trust/trust-badge";
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

  return (
    <main className="px-6 py-10 sm:px-8 md:px-10">
      <section className="space-y-8">
        <div className="overflow-hidden rounded-[1.8rem] border border-[var(--border)] bg-white">
          <div className="heyra-services-hero px-6 py-8 sm:px-8 sm:py-10">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--amber)]">
            Tjenester
          </p>
          <h1 className="mt-3 text-4xl leading-tight text-[var(--forest)] sm:text-5xl">
            Finn lokal hjelp du kan stole på rundt turen.
          </h1>
          <p className="mt-4 text-lg leading-8 text-[var(--muted)]">
            Dette er det første tjenestelaget i Heyra for praktisk hjelp før, under eller etter en jakt- eller fisketur.
          </p>
        </div>
          </div>

          <div className="border-t border-[var(--border)] bg-[#fcfaf6] px-4 py-4 sm:px-6">
        <form className="grid gap-3 rounded-[1.3rem] border border-[var(--border)] bg-white p-4 text-sm text-[var(--muted)] sm:grid-cols-2 xl:grid-cols-4">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Søk etter tilbyder eller tjeneste"
            className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-[var(--foreground)] outline-none xl:col-span-2"
          />
          <select
            name="category"
            defaultValue={category ?? ""}
            className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-[var(--foreground)] outline-none"
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
            className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-[var(--foreground)] outline-none"
          />
          <div className="flex flex-wrap gap-3 sm:col-span-2 xl:col-span-4">
            <button
              type="submit"
              className="rounded-full bg-[var(--orange)] px-5 py-3 font-semibold text-white"
            >
              Oppdater søk
            </button>
            <Link
              href="/services"
              className="rounded-full border border-[var(--border)] px-5 py-3 font-semibold text-[var(--foreground)]"
            >
              Nullstill filtre
            </Link>
          </div>
        </form>
          </div>
        </div>

        {services.length === 0 ? (
          <div className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-8 text-base leading-8 text-[var(--muted)]">
            Ingen publiserte tjenester matcher dette søket ennå.
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {services.map((service) => (
              (() => {
                const serviceTrustBadge = getServiceTrustBadge({
                  reviewStatus: service.providerProfile.reviewStatus,
                  verifiedAt: service.providerProfile.verifiedAt,
                  yearsExperience: service.providerProfile.yearsExperience,
                  publishedServices: service.providerProfile.services.length,
                });
                const serviceTrustSummary = getServiceTrustSummary({
                  reviewStatus: service.providerProfile.reviewStatus,
                  verifiedAt: service.providerProfile.verifiedAt,
                  yearsExperience: service.providerProfile.yearsExperience,
                  publishedServices: service.providerProfile.services.length,
                });
                return (
              <article
                key={service.id}
                className="rounded-[1.6rem] border border-[var(--border)] bg-white p-6 shadow-[0_8px_24px_rgba(16,42,33,0.04)]"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--amber)]">
                  {formatServiceCategory(service.category)}
                </p>
                <h2 className="mt-3 text-2xl text-[var(--forest)]">{service.title}</h2>
                <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                  {service.providerProfile.businessName} · {service.municipality}, {service.county}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-[var(--border)] bg-[#fbf8f1] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                    {serviceTrustSummary}
                  </span>
                  {serviceTrustBadge ? <TrustBadge compact {...serviceTrustBadge} /> : null}
                </div>
                <p className="mt-4 text-sm leading-7 text-[var(--foreground)]">
                  {service.description.slice(0, 180)}
                  {service.description.length > 180 ? "..." : ""}
                </p>
                <div className="mt-5 flex items-center justify-between gap-4">
                  <span className="text-sm font-semibold text-[var(--forest)]">
                    {service.priceFromNok ? `Fra kr ${service.priceFromNok.toLocaleString("nb-NO")}` : "Pris på forespørsel"}
                  </span>
                  <Link
                    href={`/services/${service.slug}`}
                    className="rounded-full bg-[var(--forest)] px-4 py-2 text-sm font-semibold text-white"
                  >
                    Se tjeneste
                  </Link>
                </div>
              </article>
                );
              })()
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
