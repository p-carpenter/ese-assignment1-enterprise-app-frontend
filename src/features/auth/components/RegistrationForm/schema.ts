import { z } from "zod";

export const registrationSchema = z
  .object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    email: z.email("Please enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    password2: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.password2, {
    message: "Passwords do not match",
    path: ["password2"],
  });

export type RegistrationFormValues = z.infer<typeof registrationSchema>;
