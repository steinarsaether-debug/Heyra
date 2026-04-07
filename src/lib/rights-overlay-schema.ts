import {
  ConfidenceLevel,
  RightsOverlayProvenance,
  RightsOverlayType,
  RightsOverlayVisibility,
} from "@prisma/client";
import { z } from "zod";

const pointSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

const polygonSchema = z.array(pointSchema).min(3).max(500);

export const rightsOverlaySchema = z.object({
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  overlayType: z.nativeEnum(RightsOverlayType),
  visibility: z.nativeEnum(RightsOverlayVisibility).default(RightsOverlayVisibility.PRIVATE_DRAFT),
  provenance: z.nativeEnum(RightsOverlayProvenance).default(RightsOverlayProvenance.MANUAL),
  confidence: z.nativeEnum(ConfidenceLevel).default(ConfidenceLevel.LOW),
  listingId: z.string().cuid().optional().nullable(),
  sourceRef: z.string().trim().max(255).optional().or(z.literal("")),
  sourceLabel: z.string().trim().max(255).optional().or(z.literal("")),
  polygons: z.array(polygonSchema).min(1).max(10),
});

export type RightsOverlayInput = z.infer<typeof rightsOverlaySchema>;
