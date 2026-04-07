import { ComplianceTaskStatus, ComplianceTaskType } from "@prisma/client";

export function formatComplianceTaskType(type: ComplianceTaskType) {
  return type.toLowerCase().replaceAll("_", " ");
}

export function formatComplianceTaskStatus(status: ComplianceTaskStatus) {
  return status.toLowerCase().replaceAll("_", " ");
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
      return "Overdue";
    case "upcoming":
      return "Upcoming";
    case "completed":
      return "Completed";
    case "dismissed":
      return "Dismissed";
    default:
      return "Active";
  }
}
