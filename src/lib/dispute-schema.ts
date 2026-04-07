import { z } from "zod";

export const disputeTicketSchema = z.object({
  title: z.string().trim().min(6, "Add a short dispute title.").max(120, "Dispute title is too long."),
  description: z
    .string()
    .trim()
    .min(40, "Describe the issue clearly so it can be reviewed.")
    .max(3000, "Dispute description is too long."),
});

export const disputeStatusSchema = z.object({
  status: z.enum(["OPEN", "UNDER_REVIEW", "RESOLVED", "CLOSED"]),
  resolutionNotes: z
    .string()
    .trim()
    .max(2000, "Resolution notes are too long.")
    .optional()
    .transform((value) => value ?? ""),
});
