import { Prisma, ServiceProviderReviewStatus, UserRole, UserStatus } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminGrantRoleForm } from "@/components/admin/admin-grant-role-form";
import { canReviewListings } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { formatServiceProviderReviewStatus, formatUserRole, formatUserRoles, formatUserStatus } from "@/lib/user-status";

type PageProps = {
  searchParams?: Promise<{
    q?: string;
    role?: UserRole | "ALL";
    status?: UserStatus | "ALL";
    verified?: "ALL" | "YES" | "NO";
    provider?: "ALL" | "YES" | "PENDING_OR_FLAGGED";
  }>;
};

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const session = await auth();

  if (!canReviewListings(session)) {
    redirect("/dashboard");
  }

  const params = searchParams ? await searchParams : {};
  const q = params?.q?.trim() ?? "";
  const role = params?.role ?? "ALL";
  const status = params?.status ?? "ALL";
  const verified = params?.verified ?? "ALL";
  const provider = params?.provider ?? "ALL";

  const where: Prisma.UserWhereInput = {
    ...(role !== "ALL"
      ? {
          OR: [
            { role },
            {
              roles: {
                has: role,
              },
            },
          ],
        }
      : {}),
    ...(status !== "ALL" ? { status } : {}),
    ...(verified === "YES" ? { emailVerified: { not: null } } : {}),
    ...(verified === "NO" ? { emailVerified: null } : {}),
    ...(provider === "YES"
      ? { serviceProviderProfile: { isNot: null } }
      : provider === "PENDING_OR_FLAGGED"
        ? {
            serviceProviderProfile: {
              is: {
                reviewStatus: {
                  in: [ServiceProviderReviewStatus.PENDING, ServiceProviderReviewStatus.FLAGGED],
                },
              },
            },
          }
        : {}),
    ...(q
      ? {
          OR: [
            { email: { contains: q, mode: "insensitive" as const } },
            {
              pii: {
                is: {
                  fullName: { contains: q, mode: "insensitive" as const },
                },
              },
            },
          ],
        }
      : {}),
  };

  const [users, activeUsers, suspendedUsers, reviewUsers, flaggedProviders] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        emailVerified: true,
        createdAt: true,
        pii: {
                      select: {
                        fullName: true,
                      },
        },
        serviceProviderProfile: {
          select: {
            reviewStatus: true,
            businessName: true,
          },
        },
        roles: true,
        _count: {
          select: {
            bookings: true,
            properties: true,
            complianceTasks: true,
          },
        },
      },
      orderBy: [{ createdAt: "desc" }],
      take: 100,
    }),
    prisma.user.count({ where: { status: UserStatus.ACTIVE } }),
    prisma.user.count({ where: { status: UserStatus.SUSPENDED } }),
    prisma.user.count({ where: { status: UserStatus.PENDING_REVIEW } }),
    prisma.serviceProviderProfile.count({
      where: {
        reviewStatus: {
          in: ["PENDING", "FLAGGED"],
        },
      },
    }),
  ]);

  return (
    <main className="px-6 py-10 sm:px-8 md:px-10">
      <section className="space-y-6">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--amber)]">
            Brukeradministrasjon
          </p>
          <h1 className="mt-3 text-4xl leading-tight text-[var(--forest)] sm:text-5xl">
            Finn brukere, status og tillitssignaler raskt.
          </h1>
          <p className="mt-4 text-lg leading-8 text-[var(--muted)]">
            Denne flaten gir en samlet oversikt over kontoer, leverandørstatus, aktivitet og hva som trenger oppfølging.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-4">
          <article className="rounded-[1.5rem] border border-[var(--border)] bg-white/75 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">Aktive</p>
            <p className="mt-3 text-3xl text-[var(--forest)]">{activeUsers}</p>
          </article>
          <article className="rounded-[1.5rem] border border-[var(--border)] bg-white/75 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">Suspendert</p>
            <p className="mt-3 text-3xl text-[var(--forest)]">{suspendedUsers}</p>
          </article>
          <article className="rounded-[1.5rem] border border-[var(--border)] bg-white/75 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">Til gjennomgang</p>
            <p className="mt-3 text-3xl text-[var(--forest)]">{reviewUsers}</p>
          </article>
          <article className="rounded-[1.5rem] border border-[var(--border)] bg-white/75 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">Flaggede leverandører</p>
            <p className="mt-3 text-3xl text-[var(--forest)]">{flaggedProviders}</p>
          </article>
        </div>

        <AdminGrantRoleForm />

        <form className="grid gap-3 rounded-[1.3rem] border border-[var(--border)] bg-white/70 p-4 text-sm text-[var(--muted)] lg:grid-cols-5">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Søk på navn eller e-post"
            className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-[var(--foreground)] outline-none lg:col-span-2"
          />
          <select name="role" defaultValue={role} className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-[var(--foreground)] outline-none">
            <option value="ALL">Alle roller</option>
                {Object.values(UserRole).map((entry) => (
              <option key={entry} value={entry}>
                {formatUserRole(entry)}
              </option>
            ))}
          </select>
          <select name="status" defaultValue={status} className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-[var(--foreground)] outline-none">
            <option value="ALL">Alle statuser</option>
                {Object.values(UserStatus).map((entry) => (
              <option key={entry} value={entry}>
                {formatUserStatus(entry)}
              </option>
            ))}
          </select>
          <select name="verified" defaultValue={verified} className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-[var(--foreground)] outline-none">
            <option value="ALL">All e-poststatus</option>
            <option value="YES">E-post bekreftet</option>
            <option value="NO">E-post ikke bekreftet</option>
          </select>
          <select name="provider" defaultValue={provider} className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-[var(--foreground)] outline-none">
            <option value="ALL">Alle leverandørtilstander</option>
            <option value="YES">Har leverandørprofil</option>
            <option value="PENDING_OR_FLAGGED">Leverandørprofil trenger oppfølging</option>
          </select>
          <button
            type="submit"
            className="rounded-xl bg-[var(--forest)] px-4 py-3 font-semibold text-white lg:col-span-5"
          >
            Oppdater brukerliste
          </button>
        </form>

        {users.length === 0 ? (
          <article className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-8 text-base leading-8 text-[var(--muted)]">
            Ingen brukere matcher filtrene akkurat nå.
          </article>
        ) : (
          <div className="grid gap-4">
            {users.map((user) => (
              <article
                key={user.id}
                className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--amber)]">
                      {formatUserRoles(user.roles.length > 0 ? user.roles : [user.role])} · {formatUserStatus(user.status)}
                    </p>
                    <h2 className="mt-3 text-2xl text-[var(--forest)]">
                      {user.pii?.fullName ?? "Navn ikke registrert"}
                    </h2>
                    <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{user.email}</p>
                    <div className="mt-3 flex flex-wrap gap-3 text-sm leading-7 text-[var(--muted)]">
                      <span className="rounded-full border border-[var(--border)] px-3 py-1">
                        E-post {user.emailVerified ? "bekreftet" : "ikke bekreftet"}
                      </span>
                      <span className="rounded-full border border-[var(--border)] px-3 py-1">
                        Bestillinger {user._count.bookings}
                      </span>
                      <span className="rounded-full border border-[var(--border)] px-3 py-1">
                        Eiendommer {user._count.properties}
                      </span>
                      <span className="rounded-full border border-[var(--border)] px-3 py-1">
                        Etterlevelse {user._count.complianceTasks}
                      </span>
                      {user.serviceProviderProfile ? (
                        <span className="rounded-full border border-[var(--border)] px-3 py-1">
                          Leverandør {formatServiceProviderReviewStatus(user.serviceProviderProfile.reviewStatus)}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="min-w-[15rem]">
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="block rounded-2xl border border-[var(--border)] px-4 py-3 text-center font-semibold text-[var(--forest)]"
                    >
                      Åpne brukerflate
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
