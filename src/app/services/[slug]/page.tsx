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
      title: "Service not found",
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
    <main className="px-6 py-10 sm:px-8 md:px-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }}
      />
      <section className="space-y-6">
        <div className="rounded-[1.8rem] bg-[var(--forest)] p-8 text-[var(--background)]">
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
              Browse services
            </Link>
            {service.providerProfile.website ? (
              <a
                href={service.providerProfile.website}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white"
              >
                Open website
              </a>
            ) : null}
            {serviceTrustBadge ? <TrustBadge compact {...serviceTrustBadge} /> : null}
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <article className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
            <h2 className="text-2xl text-[var(--forest)]">Service overview</h2>
            <p className="mt-4 text-base leading-8 text-[var(--foreground)]">{service.description}</p>
            <div className="mt-4 rounded-[1.2rem] border border-[var(--border)] bg-[#fbf8f1] px-4 py-3 text-sm leading-7 text-[var(--foreground)]">
              <span className="font-semibold">Trust summary:</span> {serviceTrustSummary}
            </div>
          </article>

          <aside className="space-y-4">
            <article className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--amber)]">
                Contact
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
                  <p>{service.providerProfile.yearsExperience} years of local experience</p>
                ) : null}
              </div>
              <p className="mt-4 text-sm font-semibold text-[var(--forest)]">
                {service.priceFromNok ? `From NOK ${service.priceFromNok.toLocaleString("nb-NO")}` : "Price on request"}
              </p>
            </article>

            <article className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--amber)]">
                Practical details
              </p>
              <div className="mt-4 space-y-3 text-sm leading-7 text-[var(--muted)]">
                {qualifications.licenseSummary ? <p><span className="font-semibold text-[var(--foreground)]">Licences:</span> {qualifications.licenseSummary}</p> : null}
                {qualifications.equipmentSummary ? <p><span className="font-semibold text-[var(--foreground)]">Equipment:</span> {qualifications.equipmentSummary}</p> : null}
                {qualifications.transportCoverage ? <p><span className="font-semibold text-[var(--foreground)]">Transport:</span> {qualifications.transportCoverage}</p> : null}
                {qualifications.accommodationDetails ? <p><span className="font-semibold text-[var(--foreground)]">Accommodation:</span> {qualifications.accommodationDetails}</p> : null}
                {!qualifications.licenseSummary &&
                !qualifications.equipmentSummary &&
                !qualifications.transportCoverage &&
                !qualifications.accommodationDetails ? (
                  <p>No extra practical notes have been added yet.</p>
                ) : null}
              </div>
            </article>
          </aside>
        </div>
      </section>
    </main>
  );
}
