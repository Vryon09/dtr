import { Request, Response } from "express";
import * as attendanceService from "../services/attendanceService.js";
import { ClockInInput } from "../schemas/attendanceSchemas.js";

export async function clockIn(req: Request, res: Response): Promise<void> {
  try {
    const { notes } = (req.body ?? {}) as ClockInInput;
    const attendance = await attendanceService.clockIn(req.user!.id, notes);
    res.status(201).json({ success: true, data: attendance });
  } catch (err) {
    const e = err as Error & { statusCode?: number };
    res
      .status(e.statusCode ?? 500)
      .json({ success: false, message: e.message });
  }
}

export async function clockOut(req: Request, res: Response): Promise<void> {
  try {
    const attendance = await attendanceService.clockOut(req.user!.id);
    res.status(200).json({ success: true, data: attendance });
  } catch (err) {
    const e = err as Error & { statusCode?: number };
    res
      .status(e.statusCode ?? 500)
      .json({ success: false, message: e.message });
  }
}

export async function getToday(req: Request, res: Response): Promise<void> {
  try {
    const attendance = await attendanceService.getToday(req.user!.id);
    res.status(200).json({ success: true, data: attendance });
  } catch (err) {
    const e = err as Error & { statusCode?: number };
    res
      .status(e.statusCode ?? 500)
      .json({ success: false, message: e.message });
  }
}

export async function getHistory(req: Request, res: Response): Promise<void> {
  try {
    const attendances = await attendanceService.getHistory(req.user!.id);
    res.status(200).json({ success: true, data: attendances });
  } catch (err) {
    const e = err as Error & { statusCode?: number };
    res
      .status(e.statusCode ?? 500)
      .json({ success: false, message: e.message });
  }
}

export async function getSummary(req: Request, res: Response): Promise<void> {
  try {
    const summary = await attendanceService.getSummary(req.user!.id);
    res.status(200).json({ success: true, data: summary });
  } catch (err) {
    const e = err as Error & { statusCode?: number };
    res
      .status(e.statusCode ?? 500)
      .json({ success: false, message: e.message });
  }
}
