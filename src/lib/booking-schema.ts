import { z } from "zod";

export const bookingRequestSchema = z
  .object({
    startDate: z.string().min(1, "Start date is required."),
    endDate: z.string().min(1, "End date is required."),
    requestMessage: z
      .string()
      .trim()
      .min(20, "Add a short message so the landowner understands the request.")
      .max(2000, "Request message is too long."),
    attestedHunterFee: z.boolean().optional(),
    attestedFishingRules: z.boolean().optional(),
    participantCount: z.number().int().min(1).max(12).optional(),
    shareSource: z.string().trim().min(1).max(80).optional(),
    shareCampaign: z.string().trim().min(1).max(120).optional(),
    firstTouchShareSource: z.string().trim().min(1).max(80).optional(),
    firstTouchShareCampaign: z.string().trim().min(1).max(120).optional(),
    lastTouchShareSource: z.string().trim().min(1).max(80).optional(),
    lastTouchShareCampaign: z.string().trim().min(1).max(120).optional(),
  })
  .superRefine((value, ctx) => {
    const start = new Date(value.startDate);
    const end = new Date(value.endDate);

    if (Number.isNaN(start.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["startDate"],
        message: "Start date is invalid.",
      });
    }

    if (Number.isNaN(end.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "End date is invalid.",
      });
    }

    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end < start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "End date must be the same as or later than the start date.",
      });
    }
  });

export const bookingStatusSchema = z.object({
  action: z.enum([
    "approve",
    "confirm_shared",
    "decline",
    "cancel",
    "complete",
    "sign_hunter",
    "sign_landowner",
    "confirm",
    "mark_active",
  ]),
  responseMessage: z
    .string()
    .trim()
    .max(2000, "Response message is too long.")
    .optional()
    .transform((value) => value ?? ""),
});

export const bookingPaymentSchema = z.object({
  provider: z.enum(["STRIPE_SIMULATED", "VIPPS_SIMULATED", "MANUAL"]),
});

export function getBookingNights(startDate: Date, endDate: Date) {
  const msPerDay = 1000 * 60 * 60 * 24;
  const diff = Math.ceil((endDate.getTime() - startDate.getTime()) / msPerDay) + 1;
  return Math.max(diff, 1);
}
