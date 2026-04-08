import { z } from "zod";

const coordinateSchema = (label: "Latitude" | "Longitude") =>
  z
    .union([
      z.number(),
      z
        .string()
        .trim()
        .min(1, "Coordinate is required."),
    ])
    .transform((value) => Number(value))
    .pipe(
      z
        .number()
        .refine((value) => Number.isFinite(value), "Coordinate must be a number.")
        .min(
          label === "Latitude" ? -90 : -180,
          `${label} must be at least ${label === "Latitude" ? -90 : -180}.`,
        )
        .max(
          label === "Latitude" ? 90 : 180,
          `${label} must be at most ${label === "Latitude" ? 90 : 180}.`,
        ),
    );

export const boundaryPointSchema = z.object({
  lat: coordinateSchema("Latitude"),
  lng: coordinateSchema("Longitude"),
});

export const boundarySchema = z.object({
  points: z
    .array(boundaryPointSchema)
    .min(3, "Add at least three boundary points.")
    .max(50, "Too many points for the first version of this tool."),
});
