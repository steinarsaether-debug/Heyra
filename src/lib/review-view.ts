import { ReviewModerationStatus } from "@prisma/client";

export function getAverageRating(values: number[]) {
  if (values.length === 0) {
    return null;
  }

  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  return Math.round(average * 10) / 10;
}

export function formatReviewModerationStatus(status: ReviewModerationStatus) {
  switch (status) {
    case ReviewModerationStatus.PENDING:
      return "Til moderering";
    case ReviewModerationStatus.APPROVED:
      return "Godkjent";
    case ReviewModerationStatus.FLAGGED:
      return "Flagget";
    case ReviewModerationStatus.REJECTED:
      return "Avvist";
  }
}
