import {
  CancellationPolicy,
  ListingGovernanceModel,
  ListingType,
  PricingModel,
  Species,
} from "@prisma/client";
import { z } from "zod";
import { listingAvailabilitySchema } from "./listing-availability";

export const listingQuotaSchema = z.object({
  summary: z.string().trim().max(500, "Quota summary is too long.").default(""),
  availabilitySummary: z
    .string()
    .trim()
    .max(500, "Quota availability is too long.")
    .default(""),
  permitNotes: z.string().trim().max(1000, "Permit notes are too long.").default(""),
  reportingNotes: z.string().trim().max(1000, "Reporting notes are too long.").default(""),
  reportingResponsibility: z
    .string()
    .trim()
    .max(500, "Reporting responsibility is too long.")
    .default(""),
});

export const listingRulesSchema = z.object({
  speciesRestrictions: z.string().trim().max(1000, "Species restrictions are too long.").default(""),
  gearRules: z.string().trim().max(1000, "Gear rules are too long.").default(""),
  bagLimitNotes: z.string().trim().max(1000, "Bag limit notes are too long.").default(""),
  areaNotes: z.string().trim().max(1000, "Area notes are too long.").default(""),
  requiresNationalFishingLicense: z.boolean().default(false),
  publicRightsOverlayId: z
    .string()
    .cuid("Select a valid rights layer.")
    .nullable()
    .default(null),
});

export const listingDraftSchema = z.object({
  type: z.nativeEnum(ListingType),
  governanceModel: z.nativeEnum(ListingGovernanceModel),
  coApprovalRequired: z.boolean(),
  governanceNotes: z
    .string()
    .trim()
    .max(2000, "Governance notes are too long.")
    .default(""),
  governanceEvidenceNotes: z
    .string()
    .trim()
    .max(2000, "Governance evidence notes are too long.")
    .default(""),
  municipalityProcessNotes: z
    .string()
    .trim()
    .max(2000, "Municipality process notes are too long.")
    .default(""),
  title: z
    .string()
    .trim()
    .min(6, "Title must be at least 6 characters.")
    .max(120, "Title is too long."),
  description: z
    .string()
    .trim()
    .min(40, "Description should help hunters understand the terrain and offer.")
    .max(5000, "Description is too long."),
  species: z
    .array(z.nativeEnum(Species))
    .min(1, "Choose at least one target species.")
    .max(8, "Choose up to eight species."),
  pricingModel: z.nativeEnum(PricingModel),
  priceNok: z.coerce
    .number({ error: "Price must be a number." })
    .positive("Price must be greater than zero.")
    .max(1000000, "Price looks too large."),
  maxGroupSize: z.coerce
    .number({ error: "Group size must be a number." })
    .int("Group size must be a whole number.")
    .min(1, "Group size must be at least 1.")
    .max(50, "Group size looks too large."),
  minNights: z.coerce
    .number({ error: "Minimum stay must be a number." })
    .int("Minimum stay must be a whole number.")
    .min(1, "Minimum stay must be at least 1 night.")
    .max(60, "Minimum stay looks too large.")
    .nullable(),
  photoUrls: z
    .array(z.string().trim().url("Each photo URL must be valid."))
    .max(12, "Use up to 12 photo URLs for now."),
  instantBookEnabled: z.boolean(),
  cancellationPolicy: z.nativeEnum(CancellationPolicy),
  quota: listingQuotaSchema,
  rules: listingRulesSchema,
  availability: listingAvailabilitySchema,
});

export const listingStatusActionSchema = z.object({
  action: z.enum(["save_draft", "submit_for_review", "publish", "archive", "revert_to_draft"]),
  reviewerNotes: z.string().trim().max(2000, "Reviewer notes are too long.").optional(),
});

export type ListingDraftInput = z.infer<typeof listingDraftSchema>;
