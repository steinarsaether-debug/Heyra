import {
  BookingStatus,
  ListingGovernanceModel,
  SharedApprovalStatus,
  type Booking,
  type Listing,
  type Property,
  type UserPii,
} from "@prisma/client";

export type BookingWithRelations = Booking & {
  listing: Pick<
    Listing,
    | "id"
    | "slug"
    | "title"
    | "priceNok"
    | "governanceModel"
    | "coApprovalRequired"
    | "governanceNotes"
    | "quota"
    | "representativeConfirmationStatus"
  > & {
    property: Pick<Property, "cadastralRef" | "municipality" | "county"> & {
      vald: {
        name: string;
      } | null;
    };
  };
  hunter: {
    email: string;
    pii: Pick<UserPii, "fullName" | "phone"> | null;
  };
};

export function formatBookingStatus(status: BookingStatus) {
  switch (status) {
    case BookingStatus.REQUESTED:
      return "Forespurt";
    case BookingStatus.APPROVED:
      return "Godkjent";
    case BookingStatus.SHARED_CONFIRMATION_PENDING:
      return "Avventer felles bekreftelse";
    case BookingStatus.DECLINED:
      return "Avslått";
    case BookingStatus.CONTRACT_PENDING:
      return "Avventer kontrakt";
    case BookingStatus.CONFIRMED:
      return "Bekreftet";
    case BookingStatus.ACTIVE:
      return "Aktiv";
    case BookingStatus.COMPLETED:
      return "Fullført";
    case BookingStatus.CANCELLED:
      return "Avbestilt";
    case BookingStatus.DISPUTED:
      return "Under tvist";
  }
}

type BookingGovernanceContext = {
  status: BookingStatus;
  governanceModel: ListingGovernanceModel;
  coApprovalRequired: boolean;
  valdName?: string | null;
  representativeConfirmationStatus?: SharedApprovalStatus | null;
};

export function getBookingStatusLabel({
  status,
  governanceModel,
  coApprovalRequired,
  representativeConfirmationStatus,
}: BookingGovernanceContext) {
  if (status === BookingStatus.SHARED_CONFIRMATION_PENDING) {
    return representativeConfirmationStatus === SharedApprovalStatus.PENDING
      ? "Waiting for vald confirmation"
      : "Avventer felles bekreftelse";
  }

  if (status === BookingStatus.CONTRACT_PENDING) {
    return "Kontrakt og betaling venter";
  }

  if (
    status === BookingStatus.APPROVED &&
    (coApprovalRequired || governanceModel === ListingGovernanceModel.VALD_MANAGED)
  ) {
    return "Godkjent, men avventer felles bekreftelse";
  }

  return formatBookingStatus(status);
}

export function getBookingStatusGuidance({
  status,
  governanceModel,
  coApprovalRequired,
  valdName,
  representativeConfirmationStatus,
}: BookingGovernanceContext) {
  if (
    status === BookingStatus.REQUESTED &&
    (coApprovalRequired || governanceModel === ListingGovernanceModel.VALD_MANAGED)
  ) {
    if (representativeConfirmationStatus === SharedApprovalStatus.NOT_REQUESTED) {
      return `This request sits in a shared hunting area. The representative for ${valdName ?? "the shared area"} has not been asked yet, so dates and quota are still very provisional.`;
    }

    if (representativeConfirmationStatus === SharedApprovalStatus.PENDING) {
      return `This request is waiting for ${valdName ?? "shared hunting area"} confirmation before dates or quota are final.`;
    }

    return `This request may need ${valdName ?? "shared hunting area"} confirmation before dates or quota are final.`;
  }

  if (
    status === BookingStatus.SHARED_CONFIRMATION_PENDING &&
    (coApprovalRequired || governanceModel === ListingGovernanceModel.VALD_MANAGED)
  ) {
    if (representativeConfirmationStatus === SharedApprovalStatus.NOT_REQUESTED) {
      return `The request has local interest, but the shared-area representative has still not been contacted. Final access should not be assumed yet.`;
    }

    return `The request has been accepted locally, but final access still depends on ${valdName ?? "shared hunting area"} coordination before contracts and payment can start.`;
  }

  if (
    status === BookingStatus.APPROVED &&
    (coApprovalRequired || governanceModel === ListingGovernanceModel.VALD_MANAGED)
  ) {
    if (representativeConfirmationStatus === SharedApprovalStatus.CONFIRMED) {
      return `Shared-area confirmation is marked as complete, so this booking can move into contract handling when the host is ready.`;
    }

    return `The booking looks approved, but this should usually move through an explicit shared-confirmation step before contracts begin.`;
  }

  if (status === BookingStatus.CONTRACT_PENDING) {
    return "The trip has moved into contract and payment handling. Both sides should sign, then the hunter authorizes payment.";
  }

  if (status === BookingStatus.CONFIRMED) {
    return "The contract and payment are in place. The trip is confirmed and will become active on the start date.";
  }

  if (status === BookingStatus.ACTIVE) {
    return "The booking is active. Payment has been captured and the trip is in progress or checked in.";
  }

  return null;
}
