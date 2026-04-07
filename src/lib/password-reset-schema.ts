import { z } from "zod";

export const passwordResetRequestSchema = z.object({
  email: z.email("Enter a valid email address.").transform((value) => value.toLowerCase()),
});

export const passwordResetCompleteSchema = z
  .object({
    token: z.string().min(20, "Reset token is required."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(8, "Confirm the new password."),
  })
  .superRefine((value, ctx) => {
    if (value.password !== value.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "Passwords do not match.",
      });
    }
  });
