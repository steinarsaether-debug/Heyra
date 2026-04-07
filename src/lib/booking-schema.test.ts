import { describe, expect, it } from "vitest";
import { bookingRequestSchema, getBookingNights } from "./booking-schema";

describe("bookingRequestSchema", () => {
  it("accepts a valid request payload", () => {
    const parsed = bookingRequestSchema.safeParse({
      startDate: "2026-09-10",
      endDate: "2026-09-12",
      requestMessage: "We are two hunters with previous moose hunting experience and would like a quiet, well-organised trip.",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects an end date before the start date", () => {
    const parsed = bookingRequestSchema.safeParse({
      startDate: "2026-09-12",
      endDate: "2026-09-10",
      requestMessage: "We would like to visit your property and are flexible on practical details.",
    });

    expect(parsed.success).toBe(false);
  });
});

describe("getBookingNights", () => {
  it("counts an inclusive date range", () => {
    const nights = getBookingNights(new Date("2026-09-10"), new Date("2026-09-12"));
    expect(nights).toBe(3);
  });
});
