import { ConfidenceLevel, SharedApprovalStatus, TerrainType, ValdVerificationMethod } from "@prisma/client";
import { z } from "zod";

export const propertyDraftSchema = z.object({
  cadastralRef: z
    .string()
    .trim()
    .min(3, "Cadastral number is required.")
    .max(100, "Cadastral number is too long."),
  municipality: z
    .string()
    .trim()
    .min(2, "Municipality is required.")
    .max(100, "Municipality is too long."),
  county: z
    .string()
    .trim()
    .min(2, "County is required.")
    .max(100, "County is too long."),
  areaHectares: z.coerce
    .number({ error: "Area must be a number." })
    .positive("Area must be greater than zero.")
    .max(1000000, "Area looks too large."),
  terrainTypes: z
    .array(z.nativeEnum(TerrainType))
    .min(1, "Choose at least one terrain type.")
    .max(4, "Choose up to four terrain types."),
  hasCabins: z.boolean(),
  hasBoats: z.boolean(),
  hasHides: z.boolean(),
  hasButcheringFacility: z.boolean(),
  valdName: z.string().trim().max(120, "Vald name is too long.").optional().default(""),
  valdRepresentativeName: z
    .string()
    .trim()
    .max(120, "Representative name is too long.")
    .optional()
    .default(""),
  valdRepresentativePhone: z
    .string()
    .trim()
    .max(40, "Representative phone is too long.")
    .optional()
    .default(""),
  valdRepresentativeEmail: z
    .string()
    .trim()
    .email("Enter a valid representative email address.")
    .optional()
    .or(z.literal(""))
    .default(""),
  valdBestandsplanName: z
    .string()
    .trim()
    .max(120, "Bestandsplan name is too long.")
    .optional()
    .default(""),
  valdLocalReference: z.string().trim().max(120, "Vald reference is too long.").optional().default(""),
  valdAuthorityContactName: z
    .string()
    .trim()
    .max(120, "Authority contact name is too long.")
    .optional()
    .default(""),
  valdAuthorityContactPhone: z
    .string()
    .trim()
    .max(40, "Authority contact phone is too long.")
    .optional()
    .default(""),
  valdAuthorityContactEmail: z
    .string()
    .trim()
    .email("Enter a valid authority contact email address.")
    .optional()
    .or(z.literal(""))
    .default(""),
  valdVerificationMethod: z.nativeEnum(ValdVerificationMethod).default(ValdVerificationMethod.SELF_DECLARED),
  valdDataConfidence: z.nativeEnum(ConfidenceLevel).default(ConfidenceLevel.LOW),
  representativeConfirmationStatus: z
    .nativeEnum(SharedApprovalStatus)
    .default(SharedApprovalStatus.NOT_REQUESTED),
  valdCoApprovalRequired: z.boolean().default(true),
  valdNotes: z.string().trim().max(2000, "Vald notes are too long.").optional().default(""),
  geometryConfidence: z.nativeEnum(ConfidenceLevel).default(ConfidenceLevel.LOW),
  rightsConfidence: z.nativeEnum(ConfidenceLevel).default(ConfidenceLevel.LOW),
  governanceConfidence: z.nativeEnum(ConfidenceLevel).default(ConfidenceLevel.LOW),
  boundaryIsApproximate: z.boolean().default(false),
  rightsDifferFromBoundary: z.boolean().default(false),
});

export type PropertyDraftInput = z.infer<typeof propertyDraftSchema>;
