import Link from "next/link";
import { ServiceCategory, ServiceProviderReviewStatus } from "@prisma/client";
import { TrustBadge } from "@/components/trust/trust-badge";
import { formatServiceCategory } from "@/lib/service-view";
import { getServiceTrustBadge, getServiceTrustSummary } from "@/lib/service-trust";

type PublicServiceRecord = {
  id: string;
  slug: string;
  category: ServiceCategory;
  title: string;
  description: string;
  municipality: string;
  county: string;
  priceFromNok: number | null;
  providerProfile: {
    businessName: string;
    reviewStatus: ServiceProviderReviewStatus;
    verifiedAt: Date | null;
    yearsExperience: number | null;
    services: {
      id: string;
    }[];
  };
};

function getServiceVisual(category: ServiceCategory) {
  switch (category) {
    case ServiceCategory.DOG_HANDLER:
      return {
        eyebrow: "Hund og felt",
        gradient: "linear-gradient(135deg, rgba(16,42,33,0.88), rgba(36,80,64,0.74))",
      };
    case ServiceCategory.BUTCHER:
      return {
        eyebrow: "Etter jakt",
        gradient: "linear-gradient(135deg, rgba(73,36,24,0.88), rgba(124,72,38,0.72))",
      };
    case ServiceCategory.ACCOMMODATION:
      return {
        eyebrow: "Opphold",
        gradient: "linear-gradient(135deg, rgba(17,33,24,0.88), rgba(73,111,84,0.72))",
      };
    case ServiceCategory.TRANSPORT:
      return {
        eyebrow: "Logistikk",
        gradient: "linear-gradient(135deg, rgba(13,32,40,0.88), rgba(45,99,81,0.72))",
      };
  }
}

export function PublicServiceCard({
  service,
  variant = "default",
}: {
  service: PublicServiceRecord;
  variant?: "default" | "featured";
}) {
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
  const visual = getServiceVisual(service.category);

  if (variant === "featured") {
    return (
      <Link
        href={`/services/${service.slug}`}
        className="group relative min-h-[23rem] overflow-hidden rounded-[1.9rem] text-white shadow-[0_22px_55px_rgba(16,42,33,0.12)] transition hover:-translate-y-1"
        style={{ backgroundImage: visual.gradient }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.14),transparent_34%)]" />
        <div className="relative flex h-full flex-col justify-between p-6">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-white/18 bg-white/12 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white/84 backdrop-blur-sm">
              {visual.eyebrow}
            </span>
            <span className="rounded-full border border-white/18 bg-white/12 px-3 py-1 text-xs font-semibold text-white/84 backdrop-blur-sm">
              {formatServiceCategory(service.category)}
            </span>
          </div>
          <div>
            <p className="text-sm text-white/72">
              {service.providerProfile.businessName} · {service.municipality}, {service.county}
            </p>
            <h3 className="mt-3 text-2xl font-semibold leading-tight text-white">
              {service.title}
            </h3>
            <p className="mt-3 line-clamp-3 text-sm leading-7 text-white/78">
              {service.description}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              {serviceTrustBadge ? <TrustBadge compact {...serviceTrustBadge} /> : null}
              <span className="rounded-full bg-white/12 px-3 py-1 text-xs font-semibold text-white/84 backdrop-blur-sm">
                {service.priceFromNok ? `Fra kr ${service.priceFromNok.toLocaleString("nb-NO")}` : "Pris pa foresporsel"}
              </span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <article className="overflow-hidden rounded-[1.7rem] border border-[rgba(16,42,33,0.08)] bg-[rgba(255,255,255,0.9)] shadow-[0_16px_40px_rgba(16,42,33,0.05)]">
      <div
        className="px-6 py-5 text-white"
        style={{ backgroundImage: visual.gradient }}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/74">
          {formatServiceCategory(service.category)}
        </p>
        <h2 className="mt-3 text-2xl text-white">{service.title}</h2>
        <p className="mt-2 text-sm leading-7 text-white/74">
          {service.providerProfile.businessName} · {service.municipality}, {service.county}
        </p>
      </div>
      <div className="p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-[rgba(16,42,33,0.1)] bg-[#fbf8f1] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
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
            {service.priceFromNok ? `Fra kr ${service.priceFromNok.toLocaleString("nb-NO")}` : "Pris pa foresporsel"}
          </span>
          <Link
            href={`/services/${service.slug}`}
            className="rounded-full bg-[var(--forest)] px-4 py-2 text-sm font-semibold text-white"
          >
            Se tjeneste
          </Link>
        </div>
      </div>
    </article>
  );
}
