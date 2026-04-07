import { z } from "zod";

export const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required."),
  address: z.string().trim().max(500, "Address is too long.").optional().or(z.literal("")),
  phone: z.string().trim().max(100, "Phone number is too long.").optional().or(z.literal("")),
  emergencyName: z
    .string()
    .trim()
    .max(200, "Emergency contact name is too long.")
    .optional()
    .or(z.literal("")),
  emergencyPhone: z
    .string()
    .trim()
    .max(100, "Emergency contact phone is too long.")
    .optional()
    .or(z.literal("")),
  hunterNumber: z
    .string()
    .trim()
    .max(100, "Hunter number is too long.")
    .optional()
    .or(z.literal("")),
});

export type ProfileInput = z.infer<typeof profileSchema>;
