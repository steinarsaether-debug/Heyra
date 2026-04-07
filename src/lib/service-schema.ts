import { ServiceCategory } from "@prisma/client";
import { z } from "zod";

const optionalText = (max: number, message: string) =>
  z.string().trim().max(max, message).optional().transform((value) => value ?? "");

export const serviceQualificationsSchema = z.object({
  licenseSummary: optionalText(500, "License summary is too long."),
  equipmentSummary: optionalText(800, "Equipment summary is too long."),
  transportCoverage: optionalText(500, "Transport coverage is too long."),
  accommodationDetails: optionalText(800, "Accommodation details are too long."),
});

export const serviceProviderProfileSchema = z.object({
  businessName: z
    .string()
    .trim()
    .min(3, "Add the provider or business name.")
    .max(120, "Name is too long."),
  publicContactName: optionalText(120, "Contact name is too long."),
  phone: optionalText(50, "Phone number is too long."),
  email: z.string().trim().email("Enter a valid public contact email.").optional().or(z.literal("")).transform((value) => value ?? ""),
  website: z
    .string()
    .trim()
    .url("Enter a valid website URL.")
    .optional()
    .or(z.literal(""))
    .transform((value) => value ?? ""),
  municipality: z.string().trim().min(2, "Add the municipality.").max(120, "Municipality is too long."),
  county: z.string().trim().min(2, "Add the county.").max(120, "County is too long."),
  latitude: z.coerce.number().min(57, "Latitude should be in Norway.").max(72, "Latitude should be in Norway.").nullable(),
  longitude: z.coerce.number().min(4, "Longitude should be in Norway.").max(32, "Longitude should be in Norway.").nullable(),
  yearsExperience: z.coerce.number().int("Years must be a whole number.").min(0, "Years cannot be negative.").max(80, "Years look too high.").nullable(),
  description: z
    .string()
    .trim()
    .min(40, "Describe the provider clearly so guests know what you offer.")
    .max(3000, "Description is too long."),
  qualifications: serviceQualificationsSchema,
});

export const serviceListingSchema = z.object({
  category: z.nativeEnum(ServiceCategory),
  title: z.string().trim().min(6, "Add a clearer service title.").max(120, "Title is too long."),
  description: z
    .string()
    .trim()
    .min(40, "Describe what the service includes and who it fits.")
    .max(4000, "Description is too long."),
  municipality: z.string().trim().min(2, "Add the municipality.").max(120, "Municipality is too long."),
  county: z.string().trim().min(2, "Add the county.").max(120, "County is too long."),
  latitude: z.coerce.number().min(57, "Latitude should be in Norway.").max(72, "Latitude should be in Norway.").nullable(),
  longitude: z.coerce.number().min(4, "Longitude should be in Norway.").max(32, "Longitude should be in Norway.").nullable(),
  priceFromNok: z.coerce.number().min(0, "Price cannot be negative.").max(1000000, "Price looks too large.").nullable(),
  qualifications: serviceQualificationsSchema,
});

export const serviceStatusActionSchema = z.object({
  action: z.enum(["save_draft", "submit_for_review", "publish", "archive", "revert_to_draft"]),
  reviewerNotes: z
    .string()
    .trim()
    .max(2000, "Reviewer notes are too long.")
    .optional()
    .transform((value) => value ?? ""),
});

export const serviceProviderReviewActionSchema = z.object({
  action: z.enum(["approve", "flag"]),
  moderationNotes: z
    .string()
    .trim()
    .max(2000, "Moderation notes are too long.")
    .optional()
    .transform((value) => value ?? ""),
});

export type ServiceProviderProfileInput = z.infer<typeof serviceProviderProfileSchema>;
export type ServiceListingInput = z.infer<typeof serviceListingSchema>;
