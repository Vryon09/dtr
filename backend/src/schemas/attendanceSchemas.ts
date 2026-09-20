import { z } from "zod";

export const clockInSchema = z.object({
  notes: z
    .string()
    .trim()
    .max(500, "Notes must not exceed 500 characters")
    .optional(),
});

export const createManualAttendanceSchema = z
  .object({
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
    clockIn: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Valid clock in time is required",
    }),
    clockOut: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), {
        message: "Valid clock out time is required",
      })
      .optional(),
    notes: z
      .string()
      .trim()
      .max(500, "Notes must not exceed 500 characters")
      .optional(),
  })
  .refine(
    (data) => {
      if (data.clockOut) {
        return new Date(data.clockOut).getTime() > new Date(data.clockIn).getTime();
      }
      return true;
    },
    {
      message: "Clock out time must be later than clock in time",
      path: ["clockOut"],
    }
  );

export const updateAttendanceSchema = z
  .object({
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
      .optional(),
    clockIn: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), {
        message: "Valid clock in time is required",
      })
      .optional(),
    clockOut: z
      .string()
      .nullable()
      .optional()
      .refine((val) => val === null || val === undefined || !isNaN(Date.parse(val)), {
        message: "Valid clock out time is required",
      }),
    notes: z
      .string()
      .trim()
      .max(500, "Notes must not exceed 500 characters")
      .nullable()
      .optional(),
  })
  .refine(
    (data) => {
      if (data.clockIn && data.clockOut) {
        return new Date(data.clockOut).getTime() > new Date(data.clockIn).getTime();
      }
      return true;
    },
    {
      message: "Clock out time must be later than clock in time",
      path: ["clockOut"],
    }
  );

export type ClockInInput = z.infer<typeof clockInSchema>;
export type CreateManualAttendanceInput = z.infer<typeof createManualAttendanceSchema>;
export type UpdateAttendanceInput = z.infer<typeof updateAttendanceSchema>;
