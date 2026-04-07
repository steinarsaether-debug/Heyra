import { z } from "zod";

export const cookieConsentSchema = z.object({
  analytics: z.boolean(),
  marketing: z.boolean(),
});
