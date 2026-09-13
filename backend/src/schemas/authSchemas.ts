import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().min(1, "Email is required").email("Valid email required"),

  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters"),

  name: z.string().trim().optional(),

  requiredHours: z
    .number()
    .int("Required hours must be an integer")
    .min(1, "Required hours must be at least 1"),
});

export const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Valid email required"),

  password: z.string().min(1, "Password is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
