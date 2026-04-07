import { DisputeStatus } from "@prisma/client";

export function formatDisputeStatus(status: DisputeStatus) {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getDisputeGuidance(status: DisputeStatus) {
  if (status === "OPEN") {
    return "A moderator has not picked this up yet.";
  }

  if (status === "UNDER_REVIEW") {
    return "A moderator is reviewing the dispute details and the related booking context.";
  }

  if (status === "RESOLVED") {
    return "The dispute has a recorded resolution. Review the moderator notes before opening a new ticket.";
  }

  return "The dispute has been closed. A new ticket should only be opened if there is a genuinely new issue.";
}
