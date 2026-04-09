import Link from "next/link";
import { ConsentType } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  getUserStatusEffects,
  formatServiceProviderReviewStatus,
  formatUserRole,
  formatUserStatus,
  getUserStatusGuidance,
} from "@/lib/user-status";
import { redirect } from "next/navigation";

function formatConsentType(type: ConsentType) {
  switch (type) {
    case ConsentType.TERMS_OF_SERVICE:
      return "Bruksvilkår";
    case ConsentType.PRIVACY_POLICY:
      return "Personvern";
    case ConsentType.MARKETING:
      return "Markedsføring";
    case ConsentType.JOINT_CONTROLLER_DPA:
      return "Felles behandlingsansvar";
  }
}

export default async function AccountSettingsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login?callbackUrl=/dashboard/settings/account");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    include: {
      pii: true,
      consentRecords: {
        orderBy: {
          grantedAt: "desc",
        },
      },
      serviceProviderProfile: {
        select: {
          reviewStatus: true,
          businessName: true,
        },
      },
      complianceTasks: {
        where: {
          status: {
            in: ["OPEN", "IN_PROGRESS"],
          },
        },
        select: {
          id: true,
        },
      },
      notifications: {
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
        select: {
          id: true,
          subject: true,
          createdAt: true,
        },
      },
    },
  });

  if (!user) {
    redirect("/auth/login");
  }

  const activeConsents = user.consentRecords.filter((record) => !record.revokedAt);

  return (
    <main className="px-6 py-10 sm:px-8 md:px-10">
      <section className="space-y-6">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--amber)]">
            Kontosenter
          </p>
          <h1 className="mt-3 text-4xl leading-tight text-[var(--forest)] sm:text-5xl">
            Se rolle, status og hva kontoen er klar for.
          </h1>
          <p className="mt-4 text-lg leading-8 text-[var(--muted)]">
            Her samler vi kontoinformasjon, samtykker, verifisering og eventuell leverandørstatus på ett sted.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-5">
          <article className="rounded-[1.5rem] border border-[var(--border)] bg-white/75 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">Rolle</p>
            <p className="mt-3 text-2xl text-[var(--forest)]">{formatUserRole(user.role)}</p>
          </article>
          <article className="rounded-[1.5rem] border border-[var(--border)] bg-white/75 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">Kontostatus</p>
            <p className="mt-3 text-2xl text-[var(--forest)]">{formatUserStatus(user.status)}</p>
          </article>
          <article className="rounded-[1.5rem] border border-[var(--border)] bg-white/75 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">E-post</p>
            <p className="mt-3 text-2xl text-[var(--forest)]">{user.emailVerified ? "Bekreftet" : "Ikke bekreftet"}</p>
          </article>
          <article className="rounded-[1.5rem] border border-[var(--border)] bg-white/75 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">Aktive samtykker</p>
            <p className="mt-3 text-2xl text-[var(--forest)]">{activeConsents.length}</p>
          </article>
          <article className="rounded-[1.5rem] border border-[var(--border)] bg-white/75 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">Åpen etterlevelse</p>
            <p className="mt-3 text-2xl text-[var(--forest)]">{user.complianceTasks.length}</p>
          </article>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_0.95fr]">
          <section className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
              Kontotilstand
            </p>
            <div className="mt-4 space-y-3 text-sm leading-7 text-[var(--muted)]">
              <p>
                <span className="font-semibold text-[var(--foreground)]">Navn:</span>{" "}
                {user.pii?.fullName ?? "Ikke registrert"}
              </p>
              <p>
                <span className="font-semibold text-[var(--foreground)]">Statusveiledning:</span>{" "}
                {getUserStatusGuidance({
                  status: user.status,
                  role: user.role,
                  statusReason: user.statusReason,
                })}
              </p>
              <p>
                <span className="font-semibold text-[var(--foreground)]">BankID-verifisert:</span>{" "}
                {user.pii?.bankIdVerified ? "Ja" : "Nei"}
              </p>
              <p>
                <span className="font-semibold text-[var(--foreground)]">Vipps-verifisert:</span>{" "}
                {user.pii?.vippsVerified ? "Ja" : "Nei"}
              </p>
              {user.serviceProviderProfile ? (
                <p>
                  <span className="font-semibold text-[var(--foreground)]">Leverandørprofil:</span>{" "}
                  {user.serviceProviderProfile.businessName ?? "Uten firmanavn"} ·{" "}
                  {formatServiceProviderReviewStatus(user.serviceProviderProfile.reviewStatus)}
                </p>
              ) : null}
            </div>
            {user.status !== "ACTIVE" ? (
              <div className="mt-5 rounded-2xl border border-[var(--amber)]/25 bg-[var(--amber-soft)] px-4 py-3 text-sm leading-7 text-[var(--foreground)]">
                Dersom denne statusen virker feil, kontakt Heyra med e-postadressen din og en kort forklaring på hva som bør gjennomgås.
              </div>
            ) : null}
          </section>

          <section className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
              Neste steder å gå
            </p>
            <div className="mt-4 space-y-3">
              <Link
                href="/dashboard/profile"
                className="block rounded-2xl border border-[var(--border)] px-4 py-3 font-semibold text-[var(--forest)]"
              >
                Rediger profil
              </Link>
              <Link
                href="/dashboard/settings/legal"
                className="block rounded-2xl border border-[var(--border)] px-4 py-3 font-semibold text-[var(--forest)]"
              >
                Juridiske innstillinger og varsler
              </Link>
              <Link
                href="/auth/forgot-password"
                className="block rounded-2xl border border-[var(--border)] px-4 py-3 font-semibold text-[var(--forest)]"
              >
                Start passordbytte
              </Link>
            </div>
          </section>
        </div>

        <section className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
            Hva denne statusen betyr i praksis
          </p>
          <div className="mt-4 grid gap-3">
            {getUserStatusEffects(user.status).map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm leading-7 text-[var(--foreground)]"
              >
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
            Siste signaler fra kontoen
          </p>
          <div className="mt-4 grid gap-3">
            {user.notifications.length === 0 ? (
              <div className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm leading-7 text-[var(--muted)]">
                Ingen varsler registrert ennå.
              </div>
            ) : (
              user.notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm leading-7 text-[var(--foreground)]"
                >
                  <p className="font-semibold">{notification.subject}</p>
                  <p className="text-[var(--muted)]">{notification.createdAt.toLocaleString("nb-NO")}</p>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
            Samtykkehistorikk
          </p>
          <div className="mt-4 grid gap-3">
            {user.consentRecords.length === 0 ? (
              <div className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm leading-7 text-[var(--muted)]">
                Ingen samtykker registrert ennå.
              </div>
            ) : (
              user.consentRecords.map((record) => (
                <div
                  key={record.id}
                  className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm leading-7 text-[var(--foreground)]"
                >
                  {formatConsentType(record.type)} · versjon {record.version} · gitt{" "}
                  {record.grantedAt.toLocaleDateString("nb-NO")}
                  {record.revokedAt
                    ? ` · trukket tilbake ${record.revokedAt.toLocaleDateString("nb-NO")}`
                    : " · aktivt"}
                </div>
              ))
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
