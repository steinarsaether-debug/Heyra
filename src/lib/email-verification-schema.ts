import { z } from "zod";

export const emailVerificationSchema = z.object({
  token: z.string().min(20, "Verification token is required."),
});
