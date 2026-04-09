import { DisputeStatus } from "@prisma/client";

export function formatDisputeStatus(status: DisputeStatus) {
  switch (status) {
    case DisputeStatus.OPEN:
      return "Åpen";
    case DisputeStatus.UNDER_REVIEW:
      return "Under vurdering";
    case DisputeStatus.RESOLVED:
      return "Løst";
    case DisputeStatus.CLOSED:
      return "Lukket";
  }
}

export function getDisputeGuidance(status: DisputeStatus) {
  if (status === "OPEN") {
    return "En moderator har ikke tatt tak i denne ennå.";
  }

  if (status === "UNDER_REVIEW") {
    return "En moderator går gjennom tvisten og den tilhørende bestillingskonteksten.";
  }

  if (status === "RESOLVED") {
    return "Tvisten har en registrert løsning. Les moderatornotatene før du eventuelt åpner en ny sak.";
  }

  return "Tvisten er lukket. En ny sak bør bare opprettes hvis det finnes et reelt nytt forhold.";
}
