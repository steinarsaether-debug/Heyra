import { ComplianceTaskStatus, UserRole } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ComplianceTaskActions } from "@/components/compliance/compliance-task-actions";
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
        <div className="rounded-[1.8rem] bg-[var(--forest)] p-8 text-[var(--background)]">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-white/65">
            Compliance
          </p>
          <h1 className="mt-5 text-4xl leading-tight sm:text-5xl">Compliance workspace</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-white/75">
            {session.user.role === UserRole.LANDOWNER
              ? "Track the property, quota, and reporting follow-up that sits around your listings."
              : "Keep the practical legal follow-up visible while you move between booking, field use, and reporting."}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <span className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-[var(--forest)]">
              {openCount} open task{openCount === 1 ? "" : "s"}
            </span>
            <Link
              href="/dashboard/bookings"
              className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white"
            >
              Open bookings
            </Link>
          </div>
        </div>

        {tasks.length === 0 ? (
          <article className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-8 text-base leading-8 text-[var(--muted)]">
            No compliance tasks have been created for this account yet.
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
                    {group.tasks.length} task{group.tasks.length === 1 ? "" : "s"}
                  </h2>
                </div>
                <div className="grid gap-4">
                  {group.tasks.map((task) => (
                    <article
                      key={task.id}
                      className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6"
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
                          <div className="mt-4 space-y-2 rounded-[1.2rem] border border-[#d8e6dc] bg-[#f4faf6] px-4 py-4 text-sm leading-7 text-[#29543a]">
                            <p>
                              <span className="font-semibold">Why this exists:</span>{" "}
                              {getComplianceTaskWhy(task.taskType)}
                            </p>
                            <p>
                              <span className="font-semibold">Next step:</span>{" "}
                              {getComplianceTaskNextStep(task.taskType)}
                            </p>
                          </div>
                          <div className="mt-3 space-y-1 text-sm leading-7 text-[var(--muted)]">
                            {task.dueAt ? (
                              <p>Due: {task.dueAt.toLocaleDateString("nb-NO")}</p>
                            ) : null}
                            {task.cwdZone?.name ? <p>CWD zone: {task.cwdZone.name}</p> : null}
                            {task.cwdZone?.contactName ? <p>Contact: {task.cwdZone.contactName}</p> : null}
                            {task.cwdZone?.contactPhone ? <p>Phone: {task.cwdZone.contactPhone}</p> : null}
                            {task.cwdZone?.contactEmail ? <p>Email: {task.cwdZone.contactEmail}</p> : null}
                            {task.cwdZone?.contactWebsite ? (
                              <p>Website: {task.cwdZone.contactWebsite}</p>
                            ) : null}
                            {task.cwdZone?.samplingInstructions ? (
                              <p>Sampling: {task.cwdZone.samplingInstructions}</p>
                            ) : null}
                            {task.notes ? <p>{task.notes}</p> : null}
                          </div>
                        </div>

                        <div className="min-w-[16rem]">
                          <div className="space-y-2 text-sm leading-7 text-[var(--muted)]">
                            {task.booking ? (
                              <Link
                                href={`/dashboard/bookings/${task.booking.id}`}
                                className="block rounded-2xl border border-[var(--border)] px-4 py-3 font-semibold text-[var(--forest)]"
                              >
                                Booking: {task.booking.listing.title}
                              </Link>
                            ) : null}
                            {task.listing ? (
                              <Link
                                href={`/dashboard/properties/${task.listing.propertyId}/listing`}
                                className="block rounded-2xl border border-[var(--border)] px-4 py-3 font-semibold text-[var(--forest)]"
                              >
                                Listing: {task.listing.title}
                              </Link>
                            ) : null}
                            {task.actionUrl ? (
                              isExternalComplianceAction(task.actionUrl) ? (
                                <a
                                  href={task.actionUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="block rounded-2xl border border-[var(--border)] px-4 py-3 font-semibold text-[var(--foreground)]"
                                >
                                  {task.actionLabel ?? "Open task link"}
                                </a>
                              ) : (
                                <Link
                                  href={task.actionUrl}
                                  className="block rounded-2xl border border-[var(--border)] px-4 py-3 font-semibold text-[var(--foreground)]"
                                >
                                  {task.actionLabel ?? "Open task link"}
                                </Link>
                              )
                            ) : null}
                          </div>
                          <ComplianceTaskActions taskId={task.id} status={task.status} />
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
