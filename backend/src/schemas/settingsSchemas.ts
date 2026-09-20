import { z } from "zod";

export const updateSettingsSchema = z
  .object({
    name: z.string().trim().max(100, "Name must not exceed 100 characters").optional(),
    email: z.string().email("Valid email required").optional(),
    requiredHours: z
      .number()
      .int("Required hours must be an integer")
      .min(1, "Required hours must be at least 1")
      .optional(),
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.email !== undefined ||
      data.requiredHours !== undefined,
    {
      message: "At least one field (name, email, requiredHours) must be provided",
    }
  );

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(1, "New password is required")
    .min(8, "New password must be at least 8 characters"),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
