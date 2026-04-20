import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatServiceCategory } from "@/lib/service-view";
import { prisma } from "@/lib/prisma";
import { absoluteUrl } from "@/lib/site";
import { buildServiceJsonLd, buildServiceMetadataDescription } from "@/lib/seo";
import { getServiceTrustBadge, getServiceTrustSummary } from "@/lib/service-trust";
import { TrustBadge } from "@/components/trust/trust-badge";

type ServiceDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 300;

async function getPublishedService(slug: string) {
  return prisma.serviceListing.findFirst({
    where: {
      slug,
      status: "PUBLISHED",
    },
    include: {
      providerProfile: {
        include: {
          services: {
            where: {
              status: "PUBLISHED",
            },
            select: {
              id: true,
            },
          },
        },
      },
    },
  });
}

export async function generateMetadata({
  params,
}: ServiceDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = await getPublishedService(slug);

  if (!service) {
    return {
      title: "Tjenesten ble ikke funnet",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const metadataDescription = buildServiceMetadataDescription({
    title: service.title,
    municipality: service.municipality,
    county: service.county,
    category: service.category,
    businessName: service.providerProfile.businessName,
  });

  return {
    title: service.title,
    description: metadataDescription,
    alternates: {
      canonical: absoluteUrl(`/services/${service.slug}`),
    },
  };
}

export default async function ServiceDetailPage({ params }: ServiceDetailPageProps) {
  const { slug } = await params;
  const service = await getPublishedService(slug);

  if (!service) {
    notFound();
  }

  const qualifications = (service.qualifications as
    | {
        licenseSummary?: string;
        equipmentSummary?: string;
        transportCoverage?: string;
        accommodationDetails?: string;
      }
    | null) ?? {};
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
  const serviceJsonLd = buildServiceJsonLd({
    slug: service.slug,
    title: service.title,
    description: service.description,
    category: service.category,
    businessName: service.providerProfile.businessName,
    municipality: service.municipality,
    county: service.county,
    phone: service.providerProfile.phone,
    email: service.providerProfile.email,
    website: service.providerProfile.website,
    priceFromNok: service.priceFromNok,
  });

  return (
    <main className="px-4 py-8 sm:px-6 sm:py-10 md:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }}
      />
      <section className="space-y-6">
        <div
          className="overflow-hidden rounded-[2rem] p-8 text-[var(--background)] shadow-[0_24px_60px_rgba(16,42,33,0.12)]"
          style={{
            backgroundImage:
              "linear-gradient(135deg, rgba(10,25,22,0.92), rgba(10,25,22,0.66)), url(https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1800&q=80)",
            backgroundPosition: "center",
            backgroundSize: "cover",
          }}
        >
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-white/65">
            {formatServiceCategory(service.category)}
          </p>
          <h1 className="mt-5 text-4xl leading-tight sm:text-5xl">{service.title}</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-white/75">
            {service.providerProfile.businessName} · {service.municipality}, {service.county}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/services"
              className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-[var(--forest)]"
            >
              Se tjenester
            </Link>
            {service.providerProfile.website ? (
              <a
                href={service.providerProfile.website}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white"
              >
                Åpne nettside
              </a>
            ) : null}
            {serviceTrustBadge ? <TrustBadge compact {...serviceTrustBadge} /> : null}
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <article className="rounded-[1.8rem] border border-[rgba(16,42,33,0.08)] bg-[rgba(255,255,255,0.86)] p-6 shadow-[0_18px_40px_rgba(16,42,33,0.06)]">
            <h2 className="text-2xl text-[var(--forest)]">Om tjenesten</h2>
            <p className="mt-4 text-base leading-8 text-[var(--foreground)]">{service.description}</p>
            <div className="mt-4 rounded-[1.2rem] border border-[rgba(16,42,33,0.08)] bg-[#fbf8f1] px-4 py-3 text-sm leading-7 text-[var(--foreground)]">
              <span className="font-semibold">Tillitssammendrag:</span> {serviceTrustSummary}
            </div>
          </article>

          <aside className="space-y-4">
            <article className="rounded-[1.8rem] border border-[rgba(16,42,33,0.08)] bg-[rgba(255,255,255,0.86)] p-6 shadow-[0_18px_40px_rgba(16,42,33,0.06)]">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--amber)]">
                Kontakt
              </p>
              <h2 className="mt-3 text-2xl text-[var(--forest)]">{service.providerProfile.businessName}</h2>
              <div className="mt-4 space-y-2 text-sm leading-7 text-[var(--muted)]">
                {service.providerProfile.publicContactName ? <p>{service.providerProfile.publicContactName}</p> : null}
                {service.providerProfile.phone ? <p>{service.providerProfile.phone}</p> : null}
                {service.providerProfile.email ? <p>{service.providerProfile.email}</p> : null}
                <p>
                  {service.municipality}, {service.county}
                </p>
                {service.providerProfile.yearsExperience !== null ? (
                  <p>{service.providerProfile.yearsExperience} års lokal erfaring</p>
                ) : null}
              </div>
              <p className="mt-4 text-sm font-semibold text-[var(--forest)]">
                {service.priceFromNok ? `Fra kr ${service.priceFromNok.toLocaleString("nb-NO")}` : "Pris på forespørsel"}
              </p>
            </article>

            <article className="rounded-[1.8rem] border border-[rgba(16,42,33,0.08)] bg-[rgba(255,255,255,0.86)] p-6 shadow-[0_18px_40px_rgba(16,42,33,0.06)]">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--amber)]">
                Praktiske detaljer
              </p>
              <div className="mt-4 space-y-3 text-sm leading-7 text-[var(--muted)]">
                {qualifications.licenseSummary ? <p><span className="font-semibold text-[var(--foreground)]">Lisenser:</span> {qualifications.licenseSummary}</p> : null}
                {qualifications.equipmentSummary ? <p><span className="font-semibold text-[var(--foreground)]">Utstyr:</span> {qualifications.equipmentSummary}</p> : null}
                {qualifications.transportCoverage ? <p><span className="font-semibold text-[var(--foreground)]">Transport:</span> {qualifications.transportCoverage}</p> : null}
                {qualifications.accommodationDetails ? <p><span className="font-semibold text-[var(--foreground)]">Overnatting:</span> {qualifications.accommodationDetails}</p> : null}
                {!qualifications.licenseSummary &&
                !qualifications.equipmentSummary &&
                !qualifications.transportCoverage &&
                !qualifications.accommodationDetails ? (
                  <p>Ingen ekstra praktiske opplysninger er lagt inn ennå.</p>
                ) : null}
              </div>
            </article>
          </aside>
        </div>
      </section>
    </main>
  );
}
