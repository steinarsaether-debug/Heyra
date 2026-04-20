import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ServiceProviderProfileForm } from "@/components/services/service-provider-profile-form";
import { canManageServices, getUserRoles } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { formatServiceCategory, formatServiceStatus } from "@/lib/service-view";
import { getServiceTrustBadge, getServiceTrustSummary } from "@/lib/service-trust";
import { TrustBadge } from "@/components/trust/trust-badge";
import { formatUserStatus, getPrimaryUserRole, getUserStatusGuidance } from "@/lib/user-status";

export default async function DashboardServicesPage() {
  const session = await auth();

  if (!canManageServices(session)) {
    redirect("/dashboard");
  }

  const primaryRole = getPrimaryUserRole(getUserRoles(session.user));

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
        {session.user.status !== "ACTIVE" ? (
          <article className="rounded-[1.8rem] border border-[#d8c4a0] bg-[linear-gradient(180deg,#fffaf1,#f7efe1)] p-6 shadow-[0_18px_40px_rgba(130,94,42,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
              Kontostatus
            </p>
            <p className="mt-3 text-2xl text-[var(--forest)]">{formatUserStatus(session.user.status)}</p>
            <p className="mt-3 text-sm leading-7 text-[#6b5432]">
              {getUserStatusGuidance({
                status: session.user.status,
                role: primaryRole,
              })}
            </p>
            <div className="mt-4">
              <Link
                href="/dashboard/settings/account"
                className="inline-flex rounded-full border border-[#d8c4a0] bg-white px-4 py-2 text-sm font-semibold text-[#6b5432]"
              >
                Åpne kontostatus
              </Link>
            </div>
          </article>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="overflow-hidden rounded-[2rem] border border-[rgba(16,42,33,0.1)] bg-[rgba(255,251,245,0.92)] shadow-[0_28px_80px_rgba(16,42,33,0.12)] backdrop-blur-sm">
            <div className="bg-[linear-gradient(135deg,rgba(10,25,22,0.96),rgba(27,58,44,0.88))] p-8 text-[var(--background)]">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-white/65">
                Tjenester
              </p>
              <h1 className="mt-5 text-4xl leading-tight sm:text-5xl">
                Legg til lokale tjenester gjestene trenger rundt turen.
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-white/75">
                Start med én troverdig leverandørprofil, og publiser så ettersøkshund, slakting, overnatting eller transport som passer områdene du allerede kjenner.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 border-t border-[rgba(16,42,33,0.08)] bg-[linear-gradient(180deg,rgba(255,252,246,0.96),rgba(245,239,229,0.94))] px-8 py-6">
              <Link
                href={profile ? "/dashboard/services/new" : "#provider-profile"}
                className="rounded-full bg-[var(--forest)] px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5"
              >
                Legg til tjeneste
              </Link>
              <Link
                href="/services"
                className="rounded-full border border-[rgba(16,42,33,0.12)] bg-white/85 px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:-translate-y-0.5 hover:bg-white"
              >
                Se offentlige tjenester
              </Link>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-1">
            <article className="rounded-[1.7rem] border border-[rgba(16,42,33,0.08)] bg-[linear-gradient(180deg,rgba(255,252,246,0.94),rgba(245,239,229,0.86))] p-6 shadow-[0_18px_44px_rgba(16,42,33,0.07)]">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
                Leverandørprofil
              </p>
              <p className="mt-3 text-2xl text-[var(--forest)]">{profile ? "Klar" : "Mangler"}</p>
              <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                Én leverandørprofil brukes på alle tjenestene du publiserer.
              </p>
              {serviceTrustSummary ? (
                <p className="mt-3 text-sm leading-7 text-[var(--foreground)]">{serviceTrustSummary}</p>
              ) : null}
              {serviceTrustBadge ? (
                <div className="mt-3">
                  <TrustBadge compact {...serviceTrustBadge} />
                </div>
              ) : null}
            </article>
            <article className="rounded-[1.7rem] border border-[rgba(16,42,33,0.08)] bg-[linear-gradient(180deg,rgba(255,252,246,0.94),rgba(245,239,229,0.86))] p-6 shadow-[0_18px_44px_rgba(16,42,33,0.07)]">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
                Til gjennomgang
              </p>
              <p className="mt-3 text-2xl text-[var(--forest)]">{pendingCount}</p>
            </article>
            <article className="rounded-[1.7rem] border border-[rgba(16,42,33,0.08)] bg-[linear-gradient(180deg,rgba(255,252,246,0.94),rgba(245,239,229,0.86))] p-6 shadow-[0_18px_44px_rgba(16,42,33,0.07)]">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
                Publisert
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
                Dine tjenester
              </p>
              <h2 className="mt-2 text-3xl text-[var(--forest)]">Administrer tjenesteutkast og publiserte tilbud.</h2>
            </div>
            {profile ? (
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/dashboard/services/insights"
                  className="rounded-full border border-[var(--border)] px-5 py-3 text-sm font-semibold text-[var(--foreground)]"
                >
                  Tjenesteinnsikt
                </Link>
                <Link
                  href="/dashboard/services/new"
                  className="rounded-full bg-[var(--forest)] px-5 py-3 text-sm font-semibold text-white"
                >
                  Legg til tjeneste
                </Link>
              </div>
            ) : null}
          </div>

          {!profile ? (
            <div className="rounded-[1.8rem] border border-[rgba(16,42,33,0.08)] bg-[rgba(255,251,245,0.82)] p-6 text-sm leading-7 text-[var(--muted)] shadow-[0_18px_40px_rgba(16,42,33,0.06)]">
              Lagre leverandørprofilen først, så kan du legge til enkelttjenester.
            </div>
          ) : profile.services.length === 0 ? (
            <div className="rounded-[1.8rem] border border-[rgba(16,42,33,0.08)] bg-[rgba(255,251,245,0.82)] p-6 text-sm leading-7 text-[var(--muted)] shadow-[0_18px_40px_rgba(16,42,33,0.06)]">
              Ingen tjenester ennå. Start med ett praktisk lokalt tilbud og send det til gjennomgang.
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {profile.services.map((service) => (
                <article
                  key={service.id}
                  className="rounded-[1.8rem] border border-[rgba(16,42,33,0.08)] bg-[linear-gradient(180deg,rgba(255,252,246,0.94),rgba(245,239,229,0.86))] p-6 shadow-[0_18px_44px_rgba(16,42,33,0.07)]"
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
                      Rediger tjeneste
                    </Link>
                    {service.status === "PUBLISHED" ? (
                      <Link
                        href={`/services/${service.slug}`}
                        className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--foreground)]"
                      >
                        Se offentlig side
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
