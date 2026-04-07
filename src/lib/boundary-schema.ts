import { z } from "zod";

export const boundaryPointSchema = z.object({
  lat: z.coerce
    .number({ error: "Latitude must be a number." })
    .min(-90, "Latitude must be at least -90.")
    .max(90, "Latitude must be at most 90."),
  lng: z.coerce
    .number({ error: "Longitude must be a number." })
    .min(-180, "Longitude must be at least -180.")
    .max(180, "Longitude must be at most 180."),
});

export const boundarySchema = z.object({
  points: z
    .array(boundaryPointSchema)
    .min(3, "Add at least three boundary points.")
    .max(50, "Too many points for the first version of this tool."),
});
