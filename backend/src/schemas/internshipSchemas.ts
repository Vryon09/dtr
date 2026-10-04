import { z } from "zod";

export const createInternshipSchema = z.object({
  title: z
    .string({ error: "Title is required" })
    .trim()
    .min(1, "Title cannot be empty")
    .max(100, "Title is too long"),
  companyName: z
    .string()
    .trim()
    .max(100, "Company name is too long")
    .optional()
    .nullable(),
  requiredHours: z
    .number({ error: "Required hours must be a number" })
    .int("Required hours must be an integer")
    .positive("Required hours must be greater than 0")
    .max(2000, "Required hours must not exceed 2000"),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be in YYYY-MM-DD format")
    .optional()
    .nullable(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "End date must be in YYYY-MM-DD format")
    .optional()
    .nullable(),
});

export const updateInternshipSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title cannot be empty")
    .max(100, "Title is too long")
    .optional(),
  companyName: z
    .string()
    .trim()
    .max(100, "Company name is too long")
    .optional()
    .nullable(),
  requiredHours: z
    .number()
    .int("Required hours must be an integer")
    .positive("Required hours must be greater than 0")
    .max(2000, "Required hours must not exceed 2000")
    .optional(),
  status: z
    .enum(["ACTIVE", "COMPLETED", "ARCHIVED"], {
      error: "Status must be ACTIVE, COMPLETED, or ARCHIVED",
    })
    .optional(),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be in YYYY-MM-DD format")
    .optional()
    .nullable(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "End date must be in YYYY-MM-DD format")
    .optional()
    .nullable(),
});

export type CreateInternshipInput = z.infer<typeof createInternshipSchema>;
export type UpdateInternshipInput = z.infer<typeof updateInternshipSchema>;
