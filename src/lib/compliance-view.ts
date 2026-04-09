import { ComplianceTaskStatus, ComplianceTaskType } from "@prisma/client";

export function formatComplianceTaskType(type: ComplianceTaskType) {
  switch (type) {
    case ComplianceTaskType.CWD_GUIDANCE:
      return "CWD-veiledning";
    case ComplianceTaskType.FISHING_FEE_CONFIRMATION:
      return "Bekreft fiskeravgift";
    case ComplianceTaskType.HJORTEVILT_REPORTING:
      return "Rapportering til Hjorteviltregisteret";
    case ComplianceTaskType.SALMON_REPORTING:
      return "Lakse- og sjøørret-rapportering";
    case ComplianceTaskType.VALD_QUOTA_REVIEW:
      return "Vald, kvote og styring";
  }
}

export function formatComplianceTaskStatus(status: ComplianceTaskStatus) {
  switch (status) {
    case ComplianceTaskStatus.OPEN:
      return "Åpen";
    case ComplianceTaskStatus.IN_PROGRESS:
      return "Pågår";
    case ComplianceTaskStatus.COMPLETED:
      return "Fullført";
    case ComplianceTaskStatus.DISMISSED:
      return "Avsluttet";
  }
}

export function getComplianceBucket(input: {
  status: ComplianceTaskStatus;
  dueAt: Date | null;
  now?: Date;
}) {
  if (input.status === ComplianceTaskStatus.COMPLETED) {
    return "completed";
  }

  if (input.status === ComplianceTaskStatus.DISMISSED) {
    return "dismissed";
  }

  const now = input.now ?? new Date();
  if (input.dueAt && input.dueAt < now) {
    return "overdue";
  }

  if (
    input.dueAt &&
    input.dueAt.getTime() - now.getTime() <= 1000 * 60 * 60 * 24 * 7
  ) {
    return "upcoming";
  }

  return "active";
}

export function getComplianceBucketLabel(bucket: ReturnType<typeof getComplianceBucket>) {
  switch (bucket) {
    case "overdue":
      return "Forsinket";
    case "upcoming":
      return "Kommer snart";
    case "completed":
      return "Fullført";
    case "dismissed":
      return "Avsluttet";
    default:
      return "Aktiv oppfølging";
  }
}

export function formatComplianceDueLabel(dueAt: Date | null, now = new Date()) {
  if (!dueAt) {
    return "Ingen frist satt";
  }

  const dayDiff = Math.ceil(
    (new Date(dueAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );
  const dateLabel = dueAt.toLocaleDateString("nb-NO");

  if (dayDiff < 0) {
    return `Forsinket siden ${dateLabel}`;
  }

  if (dayDiff === 0) {
    return `Forfaller i dag (${dateLabel})`;
  }

  if (dayDiff === 1) {
    return `Forfaller i morgen (${dateLabel})`;
  }

  return `Frist ${dateLabel}`;
}
