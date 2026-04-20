import { ComplianceTaskStatus, UserRole } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ComplianceTaskActions } from "@/components/compliance/compliance-task-actions";
import { getUserRoles } from "@/lib/access";
import {
  getComplianceTaskNextStep,
  getComplianceTaskWhy,
  isExternalComplianceAction,
} from "@/lib/compliance";
import {
  formatComplianceTaskStatus,
  formatComplianceTaskType,
  getComplianceBucket,
  getComplianceBucketLabel,
} from "@/lib/compliance-view";
import { prisma } from "@/lib/prisma";

const bucketOrder = ["active", "upcoming", "overdue", "completed", "dismissed"] as const;

export default async function DashboardCompliancePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login?callbackUrl=/dashboard/compliance");
  }

  const userRoles = getUserRoles(session.user);

  const tasks = await prisma.complianceTask.findMany({
    where: {
      userId: session.user.id,
    },
    include: {
      booking: {
        select: {
          id: true,
          listing: {
            select: {
              slug: true,
              title: true,
            },
          },
        },
      },
      listing: {
        select: {
          id: true,
          propertyId: true,
          slug: true,
          title: true,
        },
      },
      cwdZone: {
        select: {
          name: true,
          contactName: true,
          contactPhone: true,
          contactEmail: true,
          contactWebsite: true,
          samplingInstructions: true,
        },
      },
    },
    orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
  });

  const grouped = bucketOrder.map((bucket) => ({
    bucket,
    label: getComplianceBucketLabel(bucket),
    tasks: tasks.filter(
      (task) =>
        getComplianceBucket({
          status: task.status,
          dueAt: task.dueAt,
        }) === bucket,
    ),
  }));

  const openCount = tasks.filter(
    (task) =>
      task.status === ComplianceTaskStatus.OPEN ||
      task.status === ComplianceTaskStatus.IN_PROGRESS,
  ).length;

  return (
    <main className="px-6 py-10 sm:px-8 md:px-10">
      <section className="space-y-6">
        <div className="overflow-hidden rounded-[2rem] border border-[rgba(16,42,33,0.1)] bg-[rgba(255,251,245,0.92)] shadow-[0_28px_80px_rgba(16,42,33,0.12)] backdrop-blur-sm">
          <div className="bg-[linear-gradient(135deg,rgba(10,25,22,0.96),rgba(27,58,44,0.88))] px-8 py-10 text-[var(--background)]">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-white/65">
            Etterlevelse
            </p>
            <h1 className="mt-5 text-4xl leading-tight sm:text-5xl">
              Arbeidsflate for etterlevelse
            </h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-white/75">
              {userRoles.includes(UserRole.LANDOWNER)
                ? "Følg opp eiendom, kvote og rapportering knyttet til annonsene dine."
                : "Hold den praktiske juridiske oppfølgingen synlig mens du beveger deg mellom bestilling, feltbruk og rapportering."}
            </p>
          </div>
          <div className="grid gap-4 border-t border-[rgba(16,42,33,0.08)] bg-[linear-gradient(180deg,rgba(255,252,246,0.96),rgba(245,239,229,0.94))] px-8 py-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
            <div className="flex flex-wrap gap-3 text-sm text-[var(--muted)]">
              <span className="rounded-full border border-[rgba(16,42,33,0.12)] bg-white/80 px-4 py-2 font-semibold text-[var(--forest)]">
                {openCount} åpne oppgave{openCount === 1 ? "" : "r"}
              </span>
              <span className="rounded-full border border-[rgba(16,42,33,0.08)] bg-[rgba(255,255,255,0.55)] px-4 py-2">
                {tasks.length} totalt i arbeidsflaten
              </span>
            </div>
            <Link
              href="/dashboard/bookings"
              className="inline-flex rounded-full border border-[rgba(16,42,33,0.12)] bg-white/85 px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:-translate-y-0.5 hover:bg-white"
            >
              Åpne bestillinger
            </Link>
          </div>
        </div>

        {tasks.length === 0 ? (
          <article className="rounded-[1.8rem] border border-[rgba(16,42,33,0.08)] bg-[rgba(255,251,245,0.82)] p-8 text-base leading-8 text-[var(--muted)] shadow-[0_18px_40px_rgba(16,42,33,0.06)]">
            Ingen etterlevelsesoppgaver er opprettet for denne kontoen ennå.
          </article>
        ) : (
          grouped.map((group) =>
            group.tasks.length > 0 ? (
              <section key={group.bucket} className="space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
                    {group.label}
                  </p>
                  <h2 className="mt-2 text-2xl text-[var(--forest)]">
                    {group.tasks.length} oppgave{group.tasks.length === 1 ? "" : "r"}
                  </h2>
                </div>
                <div className="grid gap-4">
                  {group.tasks.map((task) => (
                    <article
                      key={task.id}
                      className="rounded-[1.8rem] border border-[rgba(16,42,33,0.08)] bg-[linear-gradient(180deg,rgba(255,252,246,0.94),rgba(245,239,229,0.86))] p-6 shadow-[0_18px_44px_rgba(16,42,33,0.07)]"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="max-w-3xl">
                          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--amber)]">
                            {formatComplianceTaskType(task.taskType)} · {formatComplianceTaskStatus(task.status)}
                          </p>
                          <h3 className="mt-3 text-2xl text-[var(--forest)]">{task.title}</h3>
                          <p className="mt-2 text-sm leading-7 text-[var(--foreground)]">
                            {task.description}
                          </p>
                          <div className="mt-4 space-y-2 rounded-[1.35rem] border border-[#d8e6dc] bg-[#f4faf6] px-4 py-4 text-sm leading-7 text-[#29543a]">
                            <p>
                              <span className="font-semibold">Hvorfor dette finnes:</span>{" "}
                              {getComplianceTaskWhy(task.taskType)}
                            </p>
                            <p>
                              <span className="font-semibold">Neste steg:</span>{" "}
                              {getComplianceTaskNextStep(task.taskType)}
                            </p>
                          </div>
                          <div className="mt-3 space-y-1 text-sm leading-7 text-[var(--muted)]">
                            {task.dueAt ? (
                              <p>Frist: {task.dueAt.toLocaleDateString("nb-NO")}</p>
                            ) : null}
                            {task.cwdZone?.name ? <p>CWD-sone: {task.cwdZone.name}</p> : null}
                            {task.cwdZone?.contactName ? <p>Kontakt: {task.cwdZone.contactName}</p> : null}
                            {task.cwdZone?.contactPhone ? <p>Telefon: {task.cwdZone.contactPhone}</p> : null}
                            {task.cwdZone?.contactEmail ? <p>E-post: {task.cwdZone.contactEmail}</p> : null}
                            {task.cwdZone?.contactWebsite ? (
                              <p>Nettsted: {task.cwdZone.contactWebsite}</p>
                            ) : null}
                            {task.cwdZone?.samplingInstructions ? (
                              <p>Prøvetaking: {task.cwdZone.samplingInstructions}</p>
                            ) : null}
                            {task.notes ? <p>{task.notes}</p> : null}
                          </div>
                        </div>

                        <div className="min-w-[16rem]">
                          <div className="space-y-2 text-sm leading-7 text-[var(--muted)]">
                            {task.booking ? (
                              <Link
                                href={`/dashboard/bookings/${task.booking.id}`}
                                className="block rounded-[1.25rem] border border-[rgba(16,42,33,0.1)] bg-white/85 px-4 py-3 font-semibold text-[var(--forest)] transition hover:-translate-y-0.5 hover:bg-white"
                              >
                                Bestilling: {task.booking.listing.title}
                              </Link>
                            ) : null}
                            {task.listing ? (
                              <Link
                                href={`/dashboard/properties/${task.listing.propertyId}/listing`}
                                className="block rounded-[1.25rem] border border-[rgba(16,42,33,0.1)] bg-white/85 px-4 py-3 font-semibold text-[var(--forest)] transition hover:-translate-y-0.5 hover:bg-white"
                              >
                                Annonse: {task.listing.title}
                              </Link>
                            ) : null}
                            {task.actionUrl ? (
                              isExternalComplianceAction(task.actionUrl) ? (
                                <a
                                  href={task.actionUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="block rounded-[1.25rem] border border-[rgba(16,42,33,0.1)] bg-white/85 px-4 py-3 font-semibold text-[var(--foreground)] transition hover:-translate-y-0.5 hover:bg-white"
                                >
                                  {task.actionLabel ?? "Åpne oppgave"}
                                </a>
                              ) : (
                                <Link
                                  href={task.actionUrl}
                                  className="block rounded-[1.25rem] border border-[rgba(16,42,33,0.1)] bg-white/85 px-4 py-3 font-semibold text-[var(--foreground)] transition hover:-translate-y-0.5 hover:bg-white"
                                >
                                  {task.actionLabel ?? "Åpne oppgave"}
                                </Link>
                              )
                            ) : null}
                          </div>
                          <div className="mt-3 rounded-[1.35rem] border border-[rgba(16,42,33,0.08)] bg-white/68 p-3">
                            <ComplianceTaskActions taskId={task.id} status={task.status} />
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ) : null,
          )
        )}
      </section>
    </main>
  );
}
