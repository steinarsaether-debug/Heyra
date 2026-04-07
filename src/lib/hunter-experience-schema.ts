import { z } from "zod";

const optionalNotes = z.string().trim().max(1200, "This note is too long.").optional().transform((value) => value ?? "");

export const hunterExperienceSchema = z.object({
  title: z.string().trim().min(6, "Add a short title.").max(120, "Title is too long."),
  summary: z
    .string()
    .trim()
    .min(40, "Add a practical summary that helps the next hunter.")
    .max(3000, "Summary is too long."),
  areaQualityNotes: optionalNotes,
  accessNotes: optionalNotes,
  localServicesNotes: optionalNotes,
  accommodationNotes: optionalNotes,
  safetyNotes: optionalNotes,
});

export const hunterExperienceModerationSchema = z.object({
  action: z.enum(["approve", "flag", "reject"]),
  moderatorNotes: z
    .string()
    .trim()
    .max(2000, "Moderator notes are too long.")
    .optional()
    .transform((value) => value ?? ""),
});

export type HunterExperienceInput = z.infer<typeof hunterExperienceSchema>;
