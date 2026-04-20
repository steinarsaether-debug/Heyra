import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminUserNoteForm } from "@/components/admin/admin-user-note-form";
import { AdminUserRoleActions } from "@/components/admin/admin-user-role-actions";
import { AdminUserStatusActions } from "@/components/admin/admin-user-status-actions";
import { canReviewListings } from "@/lib/access";
import { formatBookingStatus } from "@/lib/booking-view";
import { formatComplianceTaskStatus } from "@/lib/compliance-view";
import { formatDisputeStatus } from "@/lib/dispute-view";
import { prisma } from "@/lib/prisma";
import { formatPropertyStatus } from "@/lib/property-view";
import {
  formatServiceProviderReviewStatus,
  formatUserRole,
  formatUserRoles,
  formatUserStatus,
  getUserStatusGuidance,
} from "@/lib/user-status";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();

  if (!canReviewListings(session)) {
    redirect("/dashboard");
  }

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      pii: true,
      serviceProviderProfile: {
        select: {
          reviewStatus: true,
          businessName: true,
          municipality: true,
          county: true,
        },
      },
      bookings: {
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          listing: {
            select: {
              title: true,
            },
          },
        },
      },
      properties: {
        take: 5,
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          cadastralRef: true,
          municipality: true,
          status: true,
        },
      },
      complianceTasks: {
        take: 8,
        orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
        select: {
          id: true,
          title: true,
          status: true,
          dueAt: true,
        },
      },
      openedDisputes: {
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          status: true,
        },
      },
      adminNotes: {
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          adminUser: {
            select: {
              pii: { select: { fullName: true } },
              email: true,
            },
          },
        },
      },
      auditLogsAsTarget: {
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          actorUser: {
            select: {
              pii: { select: { fullName: true } },
              email: true,
            },
          },
        },
      },
      _count: {
        select: {
          bookings: true,
          properties: true,
          complianceTasks: true,
          openedDisputes: true,
        },
      },
    },
  });

  if (!user) {
    notFound();
  }

  return (
    <main className="px-6 py-10 sm:px-8 md:px-10">
      <section className="space-y-6">
        <div className="overflow-hidden rounded-[2rem] border border-[rgba(16,42,33,0.1)] bg-[rgba(255,251,245,0.92)] shadow-[0_28px_80px_rgba(16,42,33,0.12)] backdrop-blur-sm">
          <div className="bg-[linear-gradient(135deg,rgba(10,25,22,0.96),rgba(27,58,44,0.88))] px-8 py-10 text-white">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/65">
              Brukerflate
            </p>
            <h1 className="mt-3 text-4xl leading-tight sm:text-5xl">
              {user.pii?.fullName ?? user.email}
            </h1>
            <p className="mt-4 text-lg leading-8 text-white/75">
              {user.email} · {formatUserRoles(user.roles.length > 0 ? user.roles : [user.role])} · {formatUserStatus(user.status)}
            </p>
          </div>
          <div className="grid gap-4 border-t border-[rgba(16,42,33,0.08)] bg-[linear-gradient(180deg,rgba(255,252,246,0.96),rgba(245,239,229,0.94))] px-8 py-6 lg:grid-cols-4">
            <article className="rounded-[1.5rem] border border-[rgba(16,42,33,0.08)] bg-white/80 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">Bestillinger</p>
              <p className="mt-3 text-3xl text-[var(--forest)]">{user._count.bookings}</p>
            </article>
            <article className="rounded-[1.5rem] border border-[rgba(16,42,33,0.08)] bg-white/80 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">Eiendommer</p>
              <p className="mt-3 text-3xl text-[var(--forest)]">{user._count.properties}</p>
            </article>
            <article className="rounded-[1.5rem] border border-[rgba(16,42,33,0.08)] bg-white/80 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">Etterlevelse</p>
              <p className="mt-3 text-3xl text-[var(--forest)]">{user._count.complianceTasks}</p>
            </article>
            <article className="rounded-[1.5rem] border border-[rgba(16,42,33,0.08)] bg-white/80 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">Tvister</p>
              <p className="mt-3 text-3xl text-[var(--forest)]">{user._count.openedDisputes}</p>
            </article>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_0.95fr]">
          <section className="space-y-4 rounded-[1.8rem] border border-[rgba(16,42,33,0.08)] bg-[linear-gradient(180deg,rgba(255,252,246,0.94),rgba(245,239,229,0.86))] p-6 shadow-[0_18px_44px_rgba(16,42,33,0.07)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
              Profil og tillit
            </p>
            <div className="space-y-2 text-sm leading-7 text-[var(--muted)]">
              <p><span className="font-semibold text-[var(--foreground)]">Navn:</span> {user.pii?.fullName ?? "Ikke registrert"}</p>
              <p><span className="font-semibold text-[var(--foreground)]">Telefon:</span> {user.pii?.phone ?? "Ikke registrert"}</p>
              <p><span className="font-semibold text-[var(--foreground)]">E-post:</span> {user.email}</p>
              <p><span className="font-semibold text-[var(--foreground)]">E-postbekreftelse:</span> {user.emailVerified ? user.emailVerified.toLocaleString("nb-NO") : "Ikke bekreftet"}</p>
              <p><span className="font-semibold text-[var(--foreground)]">BankID-verifisert:</span> {user.pii?.bankIdVerified ? "Ja" : "Nei"}</p>
              <p><span className="font-semibold text-[var(--foreground)]">Vipps-verifisert:</span> {user.pii?.vippsVerified ? "Ja" : "Nei"}</p>
              <p><span className="font-semibold text-[var(--foreground)]">Roller:</span> {formatUserRoles(user.roles.length > 0 ? user.roles : [user.role])}</p>
              <p><span className="font-semibold text-[var(--foreground)]">Statusveiledning:</span> {getUserStatusGuidance({ status: user.status, role: user.role, statusReason: user.statusReason })}</p>
              {user.serviceProviderProfile ? (
                <p>
                  <span className="font-semibold text-[var(--foreground)]">Leverandørprofil:</span>{" "}
                  {user.serviceProviderProfile.businessName ?? "Uten firmanavn"} · {formatServiceProviderReviewStatus(user.serviceProviderProfile.reviewStatus)}
                </p>
              ) : null}
              {user.statusReason ? (
                <p><span className="font-semibold text-[var(--foreground)]">Statusgrunn:</span> {user.statusReason}</p>
              ) : null}
            </div>
          </section>

          <div className="space-y-4">
            {user.status !== "ACTIVE" ? (
              <section className="rounded-[1.8rem] border border-[#d8c4a0] bg-[linear-gradient(180deg,#fffaf1,#f7efe1)] p-6 shadow-[0_18px_40px_rgba(130,94,42,0.08)]">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
                  Operativ konsekvens
                </p>
                <p className="mt-3 text-sm leading-7 text-[#6b5432]">
                  Denne brukeren kan fortsatt ha innsyn i enkelte oversikter, men operative flater og endringer er begrenset så lenge statusen ikke er aktiv.
                </p>
                {user.statusReason ? (
                  <p className="mt-3 text-sm leading-7 text-[#6b5432]">
                    Intern statusgrunn: {user.statusReason}
                  </p>
                ) : null}
              </section>
            ) : null}
            <AdminUserRoleActions userId={user.id} currentRoles={user.roles.length > 0 ? user.roles : [user.role]} />
            <AdminUserStatusActions userId={user.id} currentStatus={user.status} />
            <AdminUserNoteForm userId={user.id} />
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-[1.8rem] border border-[rgba(16,42,33,0.08)] bg-[rgba(255,251,245,0.84)] p-6 shadow-[0_18px_40px_rgba(16,42,33,0.06)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
              Nylige bestillinger og eiendommer
            </p>
            <div className="mt-4 space-y-3 text-sm leading-7 text-[var(--muted)]">
              {user.bookings.map((booking) => (
                <div key={booking.id} className="rounded-[1.25rem] border border-[rgba(16,42,33,0.08)] bg-white/72 px-4 py-3">
                  <p className="font-semibold text-[var(--foreground)]">{booking.listing.title}</p>
                  <p>Status: {formatBookingStatus(booking.status)} · Opprettet {booking.createdAt.toLocaleDateString("nb-NO")}</p>
                </div>
              ))}
              {user.properties.map((property) => (
                <div key={property.id} className="rounded-[1.25rem] border border-[rgba(16,42,33,0.08)] bg-white/72 px-4 py-3">
                  <p className="font-semibold text-[var(--foreground)]">{property.cadastralRef}</p>
                  <p>{property.municipality} · {formatPropertyStatus(property.status)}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[1.8rem] border border-[rgba(16,42,33,0.08)] bg-[rgba(255,251,245,0.84)] p-6 shadow-[0_18px_40px_rgba(16,42,33,0.06)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
              Etterlevelse og tvister
            </p>
            <div className="mt-4 space-y-3 text-sm leading-7 text-[var(--muted)]">
              {user.complianceTasks.map((task) => (
                <div key={task.id} className="rounded-[1.25rem] border border-[rgba(16,42,33,0.08)] bg-white/72 px-4 py-3">
                  <p className="font-semibold text-[var(--foreground)]">{task.title}</p>
                  <p>{formatComplianceTaskStatus(task.status)} {task.dueAt ? `· frist ${task.dueAt.toLocaleDateString("nb-NO")}` : ""}</p>
                </div>
              ))}
              {user.openedDisputes.map((dispute) => (
                <div key={dispute.id} className="rounded-[1.25rem] border border-[rgba(16,42,33,0.08)] bg-white/72 px-4 py-3">
                  <p className="font-semibold text-[var(--foreground)]">{dispute.title}</p>
                  <p>{formatDisputeStatus(dispute.status)}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-[1.8rem] border border-[rgba(16,42,33,0.08)] bg-[rgba(255,251,245,0.84)] p-6 shadow-[0_18px_40px_rgba(16,42,33,0.06)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
              Interne merknader
            </p>
            <div className="mt-4 space-y-3 text-sm leading-7 text-[var(--muted)]">
              {user.adminNotes.length === 0 ? (
                <p>Ingen interne merknader ennå.</p>
              ) : (
                user.adminNotes.map((note) => (
                  <div key={note.id} className="rounded-[1.25rem] border border-[rgba(16,42,33,0.08)] bg-white/72 px-4 py-3">
                    <p className="font-semibold text-[var(--foreground)]">
                      {note.adminUser.pii?.fullName ?? note.adminUser.email}
                    </p>
                    <p>{note.body}</p>
                    <p className="text-[var(--muted)]">{note.createdAt.toLocaleString("nb-NO")}</p>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-[1.8rem] border border-[rgba(16,42,33,0.08)] bg-[rgba(255,251,245,0.84)] p-6 shadow-[0_18px_40px_rgba(16,42,33,0.06)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
              Audit-logg
            </p>
            <div className="mt-4 space-y-3 text-sm leading-7 text-[var(--muted)]">
              {user.auditLogsAsTarget.length === 0 ? (
                <p>Ingen adminhandlinger logget ennå.</p>
              ) : (
                user.auditLogsAsTarget.map((log) => (
                  <div key={log.id} className="rounded-[1.25rem] border border-[rgba(16,42,33,0.08)] bg-white/72 px-4 py-3">
                    <p className="font-semibold text-[var(--foreground)]">{log.summary}</p>
                    <p>{log.actorUser.pii?.fullName ?? log.actorUser.email}</p>
                    <p>{log.createdAt.toLocaleString("nb-NO")}</p>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
