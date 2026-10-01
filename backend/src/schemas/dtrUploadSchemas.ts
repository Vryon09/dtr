import { z } from "zod";

const timeRegex = /^\d{2}:\d{2}$/;

export const bulkImportSchema = z.object({
  payPeriodYear: z.number().int().min(2020).max(2100),
  payPeriodMonth: z.number().int().min(1).max(12),
  entries: z
    .array(
      z.object({
        day: z.number().int().min(1).max(31),
        clockIn: z.string().regex(timeRegex, "Clock in must be in HH:mm format"),
        clockOut: z
          .string()
          .regex(timeRegex, "Clock out must be in HH:mm format")
          .optional(),
        breakStart: z
          .string()
          .regex(timeRegex, "Break start must be in HH:mm format")
          .optional(),
        breakEnd: z
          .string()
          .regex(timeRegex, "Break end must be in HH:mm format")
          .optional(),
        notes: z.string().max(500).optional(),
      })
    )
    .min(1, "At least one entry is required"),
});

export type BulkImportInput = z.infer<typeof bulkImportSchema>;
