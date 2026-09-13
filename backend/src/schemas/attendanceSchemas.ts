import { z } from "zod";

export const clockInSchema = z.object({
  notes: z
    .string()
    .trim()
    .max(500, "Notes must not exceed 500 characters")
    .optional(),
});

export type ClockInInput = z.infer<typeof clockInSchema>;
