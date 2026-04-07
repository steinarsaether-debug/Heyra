import { z } from "zod";

export const complianceTaskActionSchema = z.object({
  action: z.enum(["start", "complete", "dismiss", "reopen"]),
});
