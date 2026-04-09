import { describe, expect, it } from "vitest";
import { BookingStatus, ListingGovernanceModel } from "@prisma/client";
import { getBookingStatusGuidance, getBookingStatusLabel } from "./booking-view";

describe("booking governance labels", () => {
  it("uses the explicit shared confirmation label", () => {
    expect(
      getBookingStatusLabel({
        status: BookingStatus.SHARED_CONFIRMATION_PENDING,
        governanceModel: ListingGovernanceModel.VALD_MANAGED,
        coApprovalRequired: true,
        valdName: "Trysil storvald",
      }),
    ).toBe("Avventer felles bekreftelse");
  });

  it("explains what shared confirmation means", () => {
    expect(
      getBookingStatusGuidance({
        status: BookingStatus.SHARED_CONFIRMATION_PENDING,
        governanceModel: ListingGovernanceModel.VALD_MANAGED,
        coApprovalRequired: true,
        valdName: "Trysil storvald",
      }),
    ).toContain("Trysil storvald");
  });
});
