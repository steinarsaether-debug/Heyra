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

  const isAdmin = session.user.role === UserRole.ADMIN;
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
              Service insights
            </p>
            <h1 className="mt-3 text-4xl leading-tight text-[var(--forest)] sm:text-5xl">
              Track marketplace coverage before launch.
            </h1>
            <p className="mt-4 text-lg leading-8 text-[var(--muted)]">
              This view is for launch readiness rather than ad-style analytics. It answers whether the service layer is broad enough, reviewed enough, and close enough to active areas.
            </p>
          </div>

          <Link
            href="/dashboard/services"
            className="rounded-full border border-[var(--border)] px-5 py-3 text-sm font-semibold text-[var(--foreground)]"
          >
            Back to services
          </Link>
        </div>

        <div className="grid gap-4 lg:grid-cols-4">
          <article className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
              Services
            </p>
            <p className="mt-3 text-2xl text-[var(--forest)]">{services.length}</p>
          </article>
          <article className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
              Published
            </p>
            <p className="mt-3 text-2xl text-[var(--forest)]">
              {services.filter((service) => service.status === "PUBLISHED").length}
            </p>
          </article>
          <article className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
              Reviewed providers
            </p>
            <p className="mt-3 text-2xl text-[var(--forest)]">{approvedProviders}</p>
          </article>
          <article className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
              Nearby coverage
            </p>
            <p className="mt-3 text-2xl text-[var(--forest)]">{listingsWithNearbyServices.length}</p>
          </article>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
              Category coverage
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
                  No services yet.
                </div>
              )}
            </div>
          </article>

          <article className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
              Launch-readiness view
            </p>
            <div className="mt-4 space-y-3 text-sm leading-7 text-[var(--foreground)]">
              <div className="rounded-2xl border border-[var(--border)] px-4 py-3">
                Reviewed providers should cover more than one category before Norway launch confidence is high.
              </div>
              <div className="rounded-2xl border border-[var(--border)] px-4 py-3">
                Nearby coverage matters more than total count. The goal is practical usefulness around published listings, not a large empty directory.
              </div>
              <div className="rounded-2xl border border-[var(--border)] px-4 py-3">
                Service reviews are intentionally deferred until a real service booking or bundled purchase model exists.
              </div>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
