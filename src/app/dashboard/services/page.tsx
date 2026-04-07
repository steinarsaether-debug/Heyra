import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ServiceProviderProfileForm } from "@/components/services/service-provider-profile-form";
import { canManageServices } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { formatServiceCategory, formatServiceStatus } from "@/lib/service-view";
import { getServiceTrustBadge, getServiceTrustSummary } from "@/lib/service-trust";
import { TrustBadge } from "@/components/trust/trust-badge";

export default async function DashboardServicesPage() {
  const session = await auth();

  if (!canManageServices(session)) {
    redirect("/dashboard");
  }

  const profile = await prisma.serviceProviderProfile.findUnique({
    where: {
      userId: session.user.id,
    },
    include: {
      services: {
        orderBy: {
          updatedAt: "desc",
        },
      },
    },
  });

  const publishedCount = profile?.services.filter((service) => service.status === "PUBLISHED").length ?? 0;
  const pendingCount =
    profile?.services.filter((service) => service.status === "PENDING_REVIEW").length ?? 0;
  const serviceTrustBadge = profile
    ? getServiceTrustBadge({
        reviewStatus: profile.reviewStatus,
        verifiedAt: profile.verifiedAt,
        yearsExperience: profile.yearsExperience,
        publishedServices: publishedCount,
      })
    : null;
  const serviceTrustSummary = profile
    ? getServiceTrustSummary({
        reviewStatus: profile.reviewStatus,
        verifiedAt: profile.verifiedAt,
        yearsExperience: profile.yearsExperience,
        publishedServices: publishedCount,
      })
    : null;

  return (
    <main className="px-6 py-10 sm:px-8 md:px-10">
      <section className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[1.8rem] bg-[var(--forest)] p-8 text-[var(--background)]">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-white/65">
              Services
            </p>
            <h1 className="mt-5 text-4xl leading-tight sm:text-5xl">
              Add the local services guests need around the trip.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/75">
              Start with one trusted provider profile, then publish dog handling, butchering, accommodation, or transport services that fit the areas you already know.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={profile ? "/dashboard/services/new" : "#provider-profile"}
                className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-[var(--forest)]"
              >
                Add service
              </Link>
              <Link
                href="/services"
                className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white"
              >
                Browse public services
              </Link>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-1">
            <article className="rounded-[1.5rem] border border-[var(--border)] bg-white/75 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
                Provider profile
              </p>
              <p className="mt-3 text-2xl text-[var(--forest)]">{profile ? "Ready" : "Missing"}</p>
              <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                One provider profile supports every service you publish.
              </p>
              {serviceTrustSummary ? (
                <p className="mt-3 text-sm leading-7 text-[var(--foreground)]">{serviceTrustSummary}</p>
              ) : null}
              {serviceTrustBadge ? <div className="mt-3"><TrustBadge compact {...serviceTrustBadge} /></div> : null}
            </article>
            <article className="rounded-[1.5rem] border border-[var(--border)] bg-white/75 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
                Pending review
              </p>
              <p className="mt-3 text-2xl text-[var(--forest)]">{pendingCount}</p>
            </article>
            <article className="rounded-[1.5rem] border border-[var(--border)] bg-white/75 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
                Published
              </p>
              <p className="mt-3 text-2xl text-[var(--forest)]">{publishedCount}</p>
            </article>
          </div>
        </div>

        <div id="provider-profile">
          <ServiceProviderProfileForm
            initialProfile={
              profile
                ? {
                    businessName: profile.businessName,
                    publicContactName: profile.publicContactName ?? "",
                    phone: profile.phone ?? "",
                    email: profile.email ?? "",
                    website: profile.website ?? "",
                    municipality: profile.municipality,
                    county: profile.county,
                    latitude: profile.latitude,
                    longitude: profile.longitude,
                    yearsExperience: profile.yearsExperience,
                    description: profile.description,
                    qualifications: {
                      licenseSummary:
                        ((profile.qualifications as { licenseSummary?: string } | null)?.licenseSummary ?? ""),
                      equipmentSummary:
                        ((profile.qualifications as { equipmentSummary?: string } | null)?.equipmentSummary ?? ""),
                      transportCoverage:
                        ((profile.qualifications as { transportCoverage?: string } | null)?.transportCoverage ?? ""),
                      accommodationDetails:
                        ((profile.qualifications as { accommodationDetails?: string } | null)?.accommodationDetails ?? ""),
                    },
                  }
                : null
            }
          />
        </div>

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--amber)]">
                Your services
              </p>
              <h2 className="mt-2 text-3xl text-[var(--forest)]">Manage service drafts and published offers.</h2>
            </div>
            {profile ? (
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/dashboard/services/insights"
                  className="rounded-full border border-[var(--border)] px-5 py-3 text-sm font-semibold text-[var(--foreground)]"
                >
                  Service insights
                </Link>
                <Link
                  href="/dashboard/services/new"
                  className="rounded-full bg-[var(--forest)] px-5 py-3 text-sm font-semibold text-white"
                >
                  Add service
                </Link>
              </div>
            ) : null}
          </div>

          {!profile ? (
            <div className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6 text-sm leading-7 text-[var(--muted)]">
              Save the provider profile first, then you can add individual services.
            </div>
          ) : profile.services.length === 0 ? (
            <div className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6 text-sm leading-7 text-[var(--muted)]">
              No services yet. Start with one practical local offer and send it to review.
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {profile.services.map((service) => (
                <article
                  key={service.id}
                  className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--amber)]">
                    {formatServiceStatus(service.status)}
                  </p>
                  <h3 className="mt-3 text-2xl text-[var(--forest)]">{service.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                    {formatServiceCategory(service.category)} · {service.municipality}, {service.county}
                  </p>
                  <p className="mt-4 text-sm leading-7 text-[var(--foreground)]">
                    {service.description.slice(0, 180)}
                    {service.description.length > 180 ? "..." : ""}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link
                      href={`/dashboard/services/${service.id}`}
                      className="rounded-full bg-[var(--forest)] px-4 py-2 text-sm font-semibold text-white"
                    >
                      Edit service
                    </Link>
                    {service.status === "PUBLISHED" ? (
                      <Link
                        href={`/services/${service.slug}`}
                        className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--foreground)]"
                      >
                        View public page
                      </Link>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
