import { Request, Response } from "express";
import * as attendanceService from "../services/attendanceService.js";
import {
  ClockInInput,
  CreateManualAttendanceInput,
  UpdateAttendanceInput,
} from "../schemas/attendanceSchemas.js";

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

export async function startBreak(req: Request, res: Response): Promise<void> {
  try {
    const attendance = await attendanceService.startBreak(req.user!.id);
    res.status(200).json({ success: true, data: attendance });
  } catch (err) {
    const e = err as Error & { statusCode?: number };
    res
      .status(e.statusCode ?? 500)
      .json({ success: false, message: e.message });
  }
}

export async function endBreak(req: Request, res: Response): Promise<void> {
  try {
    const attendance = await attendanceService.endBreak(req.user!.id);
    res.status(200).json({ success: true, data: attendance });
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
    let status: "NOT_CLOCKED_IN" | "CLOCKED_IN" | "ON_BREAK" | "CLOCKED_OUT" = "NOT_CLOCKED_IN";
    if (attendance) {
      if (attendance.clockOut) {
        status = "CLOCKED_OUT";
      } else if (attendance.breakStart && !attendance.breakEnd) {
        status = "ON_BREAK";
      } else {
        status = "CLOCKED_IN";
      }
    }
    res.status(200).json({
      success: true,
      data: {
        status,
        attendance,
      },
    });
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

export async function createManual(req: Request, res: Response): Promise<void> {
  try {
    const input = req.body as CreateManualAttendanceInput;
    const attendance = await attendanceService.createManual(req.user!.id, input);
    res.status(201).json({ success: true, data: attendance });
  } catch (err) {
    const e = err as Error & { statusCode?: number };
    res
      .status(e.statusCode ?? 500)
      .json({ success: false, message: e.message });
  }
}

export async function updateAttendance(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    const input = req.body as UpdateAttendanceInput;
    const attendance = await attendanceService.updateAttendance(
      req.user!.id,
      id,
      input
    );
    res.status(200).json({ success: true, data: attendance });
  } catch (err) {
    const e = err as Error & { statusCode?: number };
    res
      .status(e.statusCode ?? 500)
      .json({ success: false, message: e.message });
  }
}

export async function deleteAttendance(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    await attendanceService.deleteAttendance(req.user!.id, id);
    res.status(200).json({ success: true, message: "Attendance deleted successfully" });
  } catch (err) {
    const e = err as Error & { statusCode?: number };
    res
      .status(e.statusCode ?? 500)
      .json({ success: false, message: e.message });
  }
}
