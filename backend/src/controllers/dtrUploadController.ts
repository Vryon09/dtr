import { Request, Response } from "express";
import { parseDtrImage } from "../services/dtrParserService.js";
import { BulkImportInput } from "../schemas/dtrUploadSchemas.js";
import { prisma } from "../lib/prisma.js";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function parseDtr(req: Request, res: Response): Promise<void> {
  try {
    const file = (req as Request & { file?: Express.Multer.File }).file;

    if (!file) {
      res
        .status(400)
        .json({ success: false, message: "No image file uploaded" });
      return;
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      res.status(400).json({
        success: false,
        message: "Invalid file type. Please upload a JPG, PNG, or WEBP image.",
      });
      return;
    }

    const entries = await parseDtrImage(file.buffer, file.mimetype);

    res.status(200).json({ success: true, data: entries });
  } catch (err) {
    const e = err as Error & { statusCode?: number };
    res
      .status(e.statusCode ?? 500)
      .json({ success: false, message: e.message });
  }
}

export async function bulkImport(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { payPeriodYear, payPeriodMonth, entries } =
      req.body as BulkImportInput;

    const created: Array<{ day: number; id: string }> = [];
    const skipped: Array<{ day: number; reason: string }> = [];
    const errors: Array<{ day: number; message: string }> = [];

    for (const entry of entries) {
      try {
        // Validate the day is valid for the given month
        const maxDay = new Date(payPeriodYear, payPeriodMonth, 0).getDate();
        if (entry.day > maxDay) {
          errors.push({
            day: entry.day,
            message: `Day ${entry.day} does not exist in ${payPeriodYear}-${String(payPeriodMonth).padStart(2, "0")}`,
          });
          continue;
        }

        const dateStr = `${payPeriodYear}-${String(payPeriodMonth).padStart(2, "0")}-${String(entry.day).padStart(2, "0")}`;
        const targetDate = new Date(`${dateStr}T00:00:00.000Z`);

        // Check for existing attendance on this date
        const existing = await prisma.attendance.findUnique({
          where: {
            userId_date: {
              userId,
              date: targetDate,
            },
          },
        });

        if (existing) {
          skipped.push({
            day: entry.day,
            reason: "Attendance already exists for this date",
          });
          continue;
        }

        // Build full datetime from date + time
        const clockInDate = new Date(
          `${dateStr}T${entry.clockIn}:00.000+08:00`
        );
        const clockOutDate = entry.clockOut
          ? new Date(`${dateStr}T${entry.clockOut}:00.000+08:00`)
          : null;
        const breakStartDate = entry.breakStart
          ? new Date(`${dateStr}T${entry.breakStart}:00.000+08:00`)
          : null;
        const breakEndDate = entry.breakEnd
          ? new Date(`${dateStr}T${entry.breakEnd}:00.000+08:00`)
          : null;

        // Validate clock out > clock in
        if (clockOutDate && clockOutDate <= clockInDate) {
          errors.push({
            day: entry.day,
            message: "Clock out time must be later than clock in time",
          });
          continue;
        }

        // Validate break times
        if (breakStartDate && breakEndDate && breakEndDate <= breakStartDate) {
          errors.push({
            day: entry.day,
            message: "Break end time must be later than break start time",
          });
          continue;
        }

        let breakMinutes = 0;
        if (breakStartDate && breakEndDate) {
          breakMinutes = Math.round(
            (breakEndDate.getTime() - breakStartDate.getTime()) / (1000 * 60)
          );
        }

        const attendance = await prisma.attendance.create({
          data: {
            userId,
            date: targetDate,
            clockIn: clockInDate,
            clockOut: clockOutDate,
            breakStart: breakStartDate,
            breakEnd: breakEndDate,
            breakMinutes,
            notes: entry.notes ?? null,
          },
        });

        created.push({ day: entry.day, id: attendance.id });
      } catch (err) {
        const e = err as Error;
        errors.push({
          day: entry.day,
          message: e.message || "Unknown error",
        });
      }
    }

    res.status(200).json({
      success: true,
      data: { created, skipped, errors },
    });
  } catch (err) {
    const e = err as Error & { statusCode?: number };
    res
      .status(e.statusCode ?? 500)
      .json({ success: false, message: e.message });
  }
}
