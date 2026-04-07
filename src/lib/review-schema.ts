import { z } from "zod";

export const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1, "Rating must be between 1 and 5.").max(5, "Rating must be between 1 and 5."),
  title: z.string().trim().min(4, "Add a short review title.").max(120, "Review title is too long."),
  body: z
    .string()
    .trim()
    .min(30, "Add a practical review that helps the other side understand the experience.")
    .max(2500, "Review text is too long."),
  flagForReview: z.boolean().optional().default(false),
});

export const reviewModerationSchema = z.object({
  action: z.enum(["approve", "flag", "reject"]),
  moderatorNotes: z
    .string()
    .trim()
    .max(2000, "Moderator notes are too long.")
    .optional()
    .transform((value) => value ?? ""),
});

export type ReviewInput = z.infer<typeof reviewSchema>;
