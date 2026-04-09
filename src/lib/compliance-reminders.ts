import {
  ComplianceTaskStatus,
  ComplianceTaskType,
  NotificationStatus,
  Prisma,
  PrismaClient,
} from "@prisma/client";
import { queueNotification } from "@/lib/notifications";

type ComplianceReminderClient = PrismaClient | Prisma.TransactionClient;

const ACTIVE_STATUSES = [ComplianceTaskStatus.OPEN, ComplianceTaskStatus.IN_PROGRESS];
const DAY_IN_MS = 1000 * 60 * 60 * 24;

function startOfDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * DAY_IN_MS);
}

function buildComplianceReminderCopy(input: {
  taskType: ComplianceTaskType;
  title: string;
  dueAt: Date;
  reminderKind: "upcoming" | "overdue";
  daysUntilDue?: number;
}) {
  const dueDate = input.dueAt.toLocaleDateString("nb-NO");

  if (input.reminderKind === "overdue") {
    return {
      subject: `Etterlevelsesoppgave på overtid: ${input.title}`,
      body: `Oppgaven "${input.title}" skulle vært fulgt opp innen ${dueDate}. Åpne etterlevelsesoversikten og avgjør om den skal fullføres, markeres som under arbeid eller avvises.`,
    };
  }

  const dayLabel =
    input.daysUntilDue === 1
      ? "i morgen"
      : `om ${input.daysUntilDue ?? 0} dager`;

  switch (input.taskType) {
    case ComplianceTaskType.CWD_GUIDANCE:
      return {
        subject: `Påminnelse om CWD-oppfølging: ${input.title}`,
        body: `Oppgaven "${input.title}" forfaller ${dayLabel} (${dueDate}). Sørg for at veiledning, prøvetaking og kontaktpunkter er klare før turen starter.`,
      };
    case ComplianceTaskType.FISHING_FEE_CONFIRMATION:
      return {
        subject: `Påminnelse om fiskeravgift: ${input.title}`,
        body: `Oppgaven "${input.title}" forfaller ${dayLabel} (${dueDate}). Bekreft nasjonal fiskeravgift og sørg for at dokumentasjon er lett tilgjengelig.`,
      };
    case ComplianceTaskType.HJORTEVILT_REPORTING:
      return {
        subject: `Påminnelse om Sett og skutt / hjortevilt: ${input.title}`,
        body: `Oppgaven "${input.title}" forfaller ${dayLabel} (${dueDate}). Hold rapporteringslenker og feltnotater klare slik at rapporteringen ikke glipper etter jakta.`,
      };
    case ComplianceTaskType.SALMON_REPORTING:
      return {
        subject: `Påminnelse om fangstrapportering: ${input.title}`,
        body: `Oppgaven "${input.title}" forfaller ${dayLabel} (${dueDate}). Bekreft hvem som rapporterer fangst og hvor gjestene finner instruksjonene.`,
      };
    case ComplianceTaskType.VALD_QUOTA_REVIEW:
      return {
        subject: `Påminnelse om kvote og vald: ${input.title}`,
        body: `Oppgaven "${input.title}" forfaller ${dayLabel} (${dueDate}). Gå gjennom kvote, styringsnotater og hvem som må godkjenne tilgangen.`,
      };
    default:
      return {
        subject: `Påminnelse om etterlevelse: ${input.title}`,
        body: `Oppgaven "${input.title}" forfaller ${dayLabel} (${dueDate}). Åpne arbeidsflaten og fullfør oppfølgingen.`,
      };
  }
}

async function ensureReminder(
  prisma: ComplianceReminderClient,
  input: {
    complianceTaskId: string;
    userId: string;
    bookingId?: string | null;
    dueAt: Date;
    scheduledFor: Date;
    template: string;
    subject: string;
    body: string;
  },
) {
  const existing = await prisma.notificationOutbox.findFirst({
    where: {
      complianceTaskId: input.complianceTaskId,
      template: input.template,
      status: {
        in: [NotificationStatus.PENDING, NotificationStatus.SENT],
      },
    },
    select: {
      id: true,
    },
  });

  if (existing) {
    return { created: false as const, notificationId: existing.id };
  }

  const notification = await queueNotification(prisma, {
    userId: input.userId,
    bookingId: input.bookingId ?? null,
    complianceTaskId: input.complianceTaskId,
    template: input.template,
    subject: input.subject,
    body: input.body,
    scheduledFor: input.scheduledFor,
  });

  return { created: true as const, notificationId: notification.id };
}

export async function scheduleComplianceReminders(
  prisma: ComplianceReminderClient,
  now = new Date(),
) {
  const tasks = await prisma.complianceTask.findMany({
    where: {
      status: {
        in: ACTIVE_STATUSES,
      },
      dueAt: {
        not: null,
      },
      user: {
        status: "ACTIVE",
      },
    },
    select: {
      id: true,
      userId: true,
      bookingId: true,
      taskType: true,
      title: true,
      dueAt: true,
      status: true,
    },
  });

  const summary = {
    checked: tasks.length,
    queued: 0,
    overdue: 0,
    upcoming: 0,
  };

  const today = startOfDay(now);

  for (const task of tasks) {
    if (!task.dueAt) {
      continue;
    }

    const dueAt = new Date(task.dueAt);
    const dayDelta = Math.round((startOfDay(dueAt).getTime() - today.getTime()) / DAY_IN_MS);

    if (dayDelta < 0) {
      const copy = buildComplianceReminderCopy({
        taskType: task.taskType,
        title: task.title,
        dueAt,
        reminderKind: "overdue",
      });

      const result = await ensureReminder(prisma, {
        complianceTaskId: task.id,
        userId: task.userId,
        bookingId: task.bookingId,
        dueAt,
        scheduledFor: now,
        template: "compliance-overdue",
        subject: copy.subject,
        body: copy.body,
      });
      if (result.created) {
        summary.queued += 1;
        summary.overdue += 1;
      }
      continue;
    }

    if (dayDelta === 1 || dayDelta === 7) {
      const copy = buildComplianceReminderCopy({
        taskType: task.taskType,
        title: task.title,
        dueAt,
        reminderKind: "upcoming",
        daysUntilDue: dayDelta,
      });

      const result = await ensureReminder(prisma, {
        complianceTaskId: task.id,
        userId: task.userId,
        bookingId: task.bookingId,
        dueAt,
        scheduledFor: now,
        template: `compliance-upcoming-${dayDelta}d`,
        subject: copy.subject,
        body: copy.body,
      });
      if (result.created) {
        summary.queued += 1;
        summary.upcoming += 1;
      }
    }
  }

  return summary;
}

export async function getComplianceReminderAdminSummary(prisma: ComplianceReminderClient) {
  const now = new Date();
  const nextWeek = addDays(now, 7);

  const [overdueTasks, upcomingTasks, pendingReminders, failedReminders] = await Promise.all([
    prisma.complianceTask.count({
      where: {
        status: {
          in: ACTIVE_STATUSES,
        },
        dueAt: {
          lt: now,
        },
      },
    }),
    prisma.complianceTask.count({
      where: {
        status: {
          in: ACTIVE_STATUSES,
        },
        dueAt: {
          gte: now,
          lte: nextWeek,
        },
      },
    }),
    prisma.notificationOutbox.count({
      where: {
        template: {
          startsWith: "compliance-",
        },
        status: NotificationStatus.PENDING,
      },
    }),
    prisma.notificationOutbox.count({
      where: {
        template: {
          startsWith: "compliance-",
        },
        status: NotificationStatus.FAILED,
      },
    }),
  ]);

  return {
    overdueTasks,
    upcomingTasks,
    pendingReminders,
    failedReminders,
  };
}
