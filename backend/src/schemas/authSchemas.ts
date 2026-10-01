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

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, "Email is required").email("Valid email required"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
