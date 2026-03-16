import { z } from "zod";

export const requestResetPasswordSchema = z.object({
  email: z.email("Please enter a valid email address"),
});

export type RequestResetPasswordFormValues = z.infer<
  typeof requestResetPasswordSchema
>;
