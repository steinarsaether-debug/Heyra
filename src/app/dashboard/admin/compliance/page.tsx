import { ComplianceTaskStatus, ComplianceTaskType } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ComplianceTaskActions } from "@/components/compliance/compliance-task-actions";
import { canReviewListings } from "@/lib/access";
import {
  getComplianceTaskNextStep,
  getComplianceTaskWhy,
  isExternalComplianceAction,
} from "@/lib/compliance";
import {
  formatComplianceTaskStatus,
  formatComplianceTaskType,
} from "@/lib/compliance-view";
import { prisma } from "@/lib/prisma";

type PageProps = {
  searchParams?: Promise<{
    status?: ComplianceTaskStatus | "ALL";
    type?: ComplianceTaskType | "ALL";
  }>;
};

export default async function AdminCompliancePage({ searchParams }: PageProps) {
  const session = await auth();

  if (!session?.user || !canReviewListings(session)) {
    redirect("/dashboard");
  }

  const params = searchParams ? await searchParams : {};
  const selectedStatus = params?.status ?? "OPEN";
  const selectedType = params?.type ?? "ALL";

  const tasks = await prisma.complianceTask.findMany({
    where: {
      ...(selectedStatus !== "ALL"
        ? {
            status: selectedStatus,
          }
        : {}),
      ...(selectedType !== "ALL"
        ? {
            taskType: selectedType,
          }
        : {}),
    },
    include: {
      user: {
        select: {
          email: true,
          role: true,
          pii: {
            select: {
              fullName: true,
            },
          },
        },
      },
      listing: {
        select: {
          id: true,
          propertyId: true,
          title: true,
        },
      },
      booking: {
        select: {
          id: true,
          listing: {
            select: {
              title: true,
            },
          },
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
    take: 100,
  });

  return (
    <main className="px-6 py-10 sm:px-8 md:px-10">
      <section className="space-y-6">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--amber)]">
            Admin
          </p>
          <h1 className="mt-3 text-4xl leading-tight text-[var(--forest)] sm:text-5xl">
            Compliance queue
          </h1>
          <p className="mt-4 text-lg leading-8 text-[var(--muted)]">
            Review the first compliance tasks created from listing and booking events.
          </p>
        </div>

        <form className="grid gap-3 rounded-[1.3rem] border border-[var(--border)] bg-white/70 p-4 text-sm text-[var(--muted)] sm:grid-cols-2">
          <select
            name="status"
            defaultValue={selectedStatus}
            className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-[var(--foreground)] outline-none"
          >
            <option value="ALL">All statuses</option>
            {Object.values(ComplianceTaskStatus).map((status) => (
              <option key={status} value={status}>
                {formatComplianceTaskStatus(status)}
              </option>
            ))}
          </select>
          <select
            name="type"
            defaultValue={selectedType}
            className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-[var(--foreground)] outline-none"
          >
            <option value="ALL">All task types</option>
            {Object.values(ComplianceTaskType).map((type) => (
              <option key={type} value={type}>
                {formatComplianceTaskType(type)}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-xl bg-[var(--forest)] px-4 py-3 font-semibold text-white sm:col-span-2"
          >
            Update queue
          </button>
        </form>

        {tasks.length === 0 ? (
          <article className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-8 text-base leading-8 text-[var(--muted)]">
            No compliance tasks match the current filters.
          </article>
        ) : (
          <div className="grid gap-4">
            {tasks.map((task) => (
              <article
                key={task.id}
                className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-3xl">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--amber)]">
                      {formatComplianceTaskType(task.taskType)} · {formatComplianceTaskStatus(task.status)}
                    </p>
                    <h2 className="mt-3 text-2xl text-[var(--forest)]">{task.title}</h2>
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
                      <p>
                        User: {task.user.pii?.fullName ?? task.user.email} · {task.user.role.toLowerCase()}
                      </p>
                      {task.dueAt ? <p>Due: {task.dueAt.toLocaleDateString("nb-NO")}</p> : null}
                      {task.cwdZone?.name ? <p>CWD zone: {task.cwdZone.name}</p> : null}
                      {task.cwdZone?.contactName ? <p>Contact: {task.cwdZone.contactName}</p> : null}
                      {task.cwdZone?.contactPhone ? <p>Phone: {task.cwdZone.contactPhone}</p> : null}
                      {task.cwdZone?.contactEmail ? <p>Email: {task.cwdZone.contactEmail}</p> : null}
                      {task.cwdZone?.contactWebsite ? <p>Website: {task.cwdZone.contactWebsite}</p> : null}
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
        )}
      </section>
    </main>
  );
}
