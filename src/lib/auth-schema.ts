import { UserRole } from "@prisma/client";
import { z } from "zod";

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, "Full name is required."),
    email: z.email("Enter a valid email address.").transform((value) => value.toLowerCase()),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string(),
    role: z.nativeEnum(UserRole),
    acceptTerms: z.boolean().refine((value) => value, "You must accept the terms."),
    acceptPrivacy: z
      .boolean()
      .refine((value) => value, "You must accept the privacy policy."),
    acceptMarketing: z.boolean().default(false),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords must match.",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;
