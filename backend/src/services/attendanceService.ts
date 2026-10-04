import { prisma } from "../lib/prisma.js";
import { getActiveInternship } from "./internshipService.js";

export interface FormattedAttendance {
  id: string;
  userId: string;
  internshipId: string;
  date: Date;
  workingDate?: string;
  clockIn: Date;
  clockInAt?: string;
  clockOut: Date | null;
  clockOutAt?: string | null;
  breakStart: Date | null;
  breakStartAt?: string | null;
  breakEnd: Date | null;
  breakEndAt?: string | null;
  breakMinutes: number;
  notes: string | null;
  renderedHours: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AttendanceSummary {
  requiredHours: number;
  completedHours: number;
  remainingHours: number;
  progressPercentage: number;
}

export function getManilaDate(date = new Date()): Date {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const manilaDateStr = formatter.format(date);
  return new Date(`${manilaDateStr}T00:00:00.000Z`);
}

function calculateRenderedHours(
  clockIn: Date,
  clockOut: Date,
  breakStart?: Date | null,
  breakEnd?: Date | null,
  fallbackBreakMinutes = 0
): number {
  const diffMs = clockOut.getTime() - clockIn.getTime();
  const rawHours = diffMs / (1000 * 60 * 60);

  let breakHours = 0;
  if (breakStart && breakEnd) {
    const breakMs = Math.max(0, breakEnd.getTime() - breakStart.getTime());
    breakHours = breakMs / (1000 * 60 * 60);
  } else if (fallbackBreakMinutes > 0) {
    breakHours = fallbackBreakMinutes / 60;
  }

  const netHours = Math.max(0, rawHours - breakHours);
  return Math.round(netHours * 100) / 100;
}

function formatAttendance(attendance: {
  id: string;
  userId: string;
  internshipId: string;
  date: Date;
  clockIn: Date;
  clockOut: Date | null;
  breakStart?: Date | null;
  breakEnd?: Date | null;
  breakMinutes?: number | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}): FormattedAttendance {
  const breakStart = attendance.breakStart ?? null;
  const breakEnd = attendance.breakEnd ?? null;
  let breakMinutes = attendance.breakMinutes ?? 0;

  if (breakStart && breakEnd) {
    breakMinutes = Math.round((breakEnd.getTime() - breakStart.getTime()) / (1000 * 60));
  }

  const renderedHours = attendance.clockOut
    ? calculateRenderedHours(attendance.clockIn, attendance.clockOut, breakStart, breakEnd, breakMinutes)
    : null;

  return {
    ...attendance,
    breakStart,
    breakStartAt: breakStart ? breakStart.toISOString() : null,
    breakEnd,
    breakEndAt: breakEnd ? breakEnd.toISOString() : null,
    breakMinutes,
    workingDate: attendance.date.toISOString(),
    clockInAt: attendance.clockIn.toISOString(),
    clockOutAt: attendance.clockOut ? attendance.clockOut.toISOString() : null,
    renderedHours,
  };
}

export async function clockIn(
  userId: string,
  notes?: string
): Promise<FormattedAttendance> {
  const now = new Date();
  const todayDate = getManilaDate(now);

  const activeSession = await prisma.attendance.findFirst({
    where: { userId, clockOut: null },
  });
  if (activeSession) {
    const err = new Error("User already has an active clock-in") as Error & {
      statusCode: number;
    };
    err.statusCode = 400;
    throw err;
  }

  const activeInternship = await getActiveInternship(userId);
  if (activeInternship.status !== "ACTIVE") {
    const err = new Error(
      "Cannot clock in for a completed or archived internship. Please switch to an active internship or create a new one."
    ) as Error & { statusCode: number };
    err.statusCode = 400;
    throw err;
  }

  const todayAttendance = await prisma.attendance.findUnique({
    where: {
      internshipId_date: {
        internshipId: activeInternship.id,
        date: todayDate,
      },
    },
  });
  if (todayAttendance) {
    const err = new Error(
      "Attendance already recorded for today in this internship"
    ) as Error & { statusCode: number };
    err.statusCode = 400;
    throw err;
  }

  const attendance = await prisma.attendance.create({
    data: {
      userId,
      internshipId: activeInternship.id,
      date: todayDate,
      clockIn: now,
      clockOut: null,
      breakStart: null,
      breakEnd: null,
      breakMinutes: 0,
      notes: notes ?? null,
    },
  });

  return formatAttendance(attendance);
}

export async function startBreak(
  userId: string
): Promise<FormattedAttendance> {
  const now = new Date();

  const active = await prisma.attendance.findFirst({
    where: { userId, clockOut: null },
  });
  if (!active) {
    const err = new Error("No active clock-in found to start break") as Error & {
      statusCode: number;
    };
    err.statusCode = 400;
    throw err;
  }

  if (active.breakStart && !active.breakEnd) {
    const err = new Error("You are already on break") as Error & {
      statusCode: number;
    };
    err.statusCode = 400;
    throw err;
  }

  if (active.breakStart && active.breakEnd) {
    const err = new Error("Break has already been logged for this session") as Error & {
      statusCode: number;
    };
    err.statusCode = 400;
    throw err;
  }

  const updated = await prisma.attendance.update({
    where: { id: active.id },
    data: {
      breakStart: now,
    },
  });

  return formatAttendance(updated);
}

export async function endBreak(
  userId: string
): Promise<FormattedAttendance> {
  const now = new Date();

  const active = await prisma.attendance.findFirst({
    where: { userId, clockOut: null },
  });
  if (!active) {
    const err = new Error("No active clock-in found") as Error & {
      statusCode: number;
    };
    err.statusCode = 400;
    throw err;
  }

  if (!active.breakStart || active.breakEnd) {
    const err = new Error("No active break found to end") as Error & {
      statusCode: number;
    };
    err.statusCode = 400;
    throw err;
  }

  if (now <= active.breakStart) {
    const err = new Error("Break end time must be later than break start time") as Error & {
      statusCode: number;
    };
    err.statusCode = 400;
    throw err;
  }

  const breakMinutes = Math.round((now.getTime() - active.breakStart.getTime()) / (1000 * 60));

  const updated = await prisma.attendance.update({
    where: { id: active.id },
    data: {
      breakEnd: now,
      breakMinutes,
    },
  });

  return formatAttendance(updated);
}

export async function clockOut(
  userId: string
): Promise<FormattedAttendance> {
  const now = new Date();

  const active = await prisma.attendance.findFirst({
    where: { userId, clockOut: null },
  });
  if (!active) {
    const err = new Error("No active clock-in found") as Error & {
      statusCode: number;
    };
    err.statusCode = 400;
    throw err;
  }

  if (now <= active.clockIn) {
    const err = new Error(
      "Clock out time must be later than clock in time"
    ) as Error & { statusCode: number };
    err.statusCode = 400;
    throw err;
  }

  let finalBreakEnd = active.breakEnd;
  let finalBreakMinutes = active.breakMinutes;

  if (active.breakStart && !active.breakEnd) {
    finalBreakEnd = now;
    finalBreakMinutes = Math.round((now.getTime() - active.breakStart.getTime()) / (1000 * 60));
  }

  const updated = await prisma.attendance.update({
    where: { id: active.id },
    data: {
      clockOut: now,
      breakEnd: finalBreakEnd,
      breakMinutes: finalBreakMinutes,
    },
  });

  return formatAttendance(updated);
}

export async function getToday(
  userId: string,
  internshipId?: string
): Promise<FormattedAttendance | null> {
  const todayDate = getManilaDate();
  let targetInternshipId = internshipId;

  if (!targetInternshipId) {
    const active = await getActiveInternship(userId);
    targetInternshipId = active.id;
  }

  const attendance = await prisma.attendance.findUnique({
    where: {
      internshipId_date: {
        internshipId: targetInternshipId,
        date: todayDate,
      },
    },
  });

  if (!attendance) {
    return null;
  }

  return formatAttendance(attendance);
}

export async function getHistory(
  userId: string,
  internshipId?: string
): Promise<FormattedAttendance[]> {
  let whereClause: { userId: string; internshipId?: string } = { userId };

  if (internshipId === "all") {
    // Return all records across all internships for this user
    whereClause = { userId };
  } else if (internshipId) {
    whereClause = { userId, internshipId };
  } else {
    const active = await getActiveInternship(userId);
    whereClause = { userId, internshipId: active.id };
  }

  const attendances = await prisma.attendance.findMany({
    where: whereClause,
    orderBy: { date: "desc" },
  });

  return attendances.map(formatAttendance);
}

export async function getSummary(
  userId: string,
  internshipId?: string
): Promise<AttendanceSummary> {
  let targetInternship;
  if (internshipId) {
    targetInternship = await prisma.internship.findFirst({
      where: { id: internshipId, userId },
    });
    if (!targetInternship) {
      const err = new Error("Internship not found") as Error & { statusCode: number };
      err.statusCode = 404;
      throw err;
    }
  } else {
    targetInternship = await getActiveInternship(userId);
  }

  const completedAttendances = await prisma.attendance.findMany({
    where: {
      userId,
      internshipId: targetInternship.id,
      clockOut: { not: null },
    },
  });

  const totalCompletedHours = completedAttendances.reduce((sum, att) => {
    if (!att.clockOut) return sum;
    let breakMins = att.breakMinutes || 0;
    if (att.breakStart && att.breakEnd) {
      breakMins = Math.max(0, Math.round((att.breakEnd.getTime() - att.breakStart.getTime()) / (1000 * 60)));
    }
    const totalShiftHours = (att.clockOut.getTime() - att.clockIn.getTime()) / (1000 * 60 * 60);
    const netHours = Math.max(0, totalShiftHours - (breakMins / 60));
    return sum + netHours;
  }, 0);

  const completedHours = Math.round(totalCompletedHours * 100) / 100;
  const remainingHours =
    Math.round(Math.max(targetInternship.requiredHours - completedHours, 0) * 100) / 100;
  const progressPercentage =
    targetInternship.requiredHours > 0
      ? Math.round(
          Math.min((completedHours / targetInternship.requiredHours) * 100, 100) * 100
        ) / 100
      : 0;

  return {
    requiredHours: targetInternship.requiredHours,
    completedHours,
    remainingHours,
    progressPercentage,
  };
}

export async function createManual(
  userId: string,
  data: {
    date: string;
    clockIn: string;
    clockOut?: string;
    breakStart?: string;
    breakEnd?: string;
    notes?: string;
    internshipId?: string;
  }
): Promise<FormattedAttendance> {
  const targetDate = new Date(`${data.date}T00:00:00.000Z`);
  const clockInDate = new Date(data.clockIn);
  const clockOutDate = data.clockOut ? new Date(data.clockOut) : null;
  const breakStartDate = data.breakStart ? new Date(data.breakStart) : null;
  const breakEndDate = data.breakEnd ? new Date(data.breakEnd) : null;

  if (clockOutDate && clockOutDate <= clockInDate) {
    const err = new Error("Clock out time must be later than clock in time") as Error & {
      statusCode: number;
    };
    err.statusCode = 400;
    throw err;
  }

  if (breakStartDate && breakEndDate && breakEndDate <= breakStartDate) {
    const err = new Error("Break end time must be later than break start time") as Error & {
      statusCode: number;
    };
    err.statusCode = 400;
    throw err;
  }

  let internship;
  if (data.internshipId) {
    internship = await prisma.internship.findFirst({
      where: { id: data.internshipId, userId },
    });
    if (!internship) {
      const err = new Error("Internship not found") as Error & { statusCode: number };
      err.statusCode = 404;
      throw err;
    }
  } else {
    internship = await getActiveInternship(userId);
  }

  if (internship.status !== "ACTIVE") {
    const err = new Error("Cannot add attendance for a completed or archived internship") as Error & {
      statusCode: number;
    };
    err.statusCode = 400;
    throw err;
  }

  const existing = await prisma.attendance.findUnique({
    where: {
      internshipId_date: {
        internshipId: internship.id,
        date: targetDate,
      },
    },
  });

  if (existing) {
    const err = new Error("Attendance already recorded for this date in this internship") as Error & {
      statusCode: number;
    };
    err.statusCode = 400;
    throw err;
  }

  if (!clockOutDate) {
    const active = await prisma.attendance.findFirst({
      where: { userId, clockOut: null },
    });
    if (active) {
      const err = new Error("User already has an active clock-in") as Error & {
        statusCode: number;
      };
      err.statusCode = 400;
      throw err;
    }
  }

  let breakMinutes = 0;
  if (breakStartDate && breakEndDate) {
    breakMinutes = Math.round((breakEndDate.getTime() - breakStartDate.getTime()) / (1000 * 60));
  }

  const attendance = await prisma.attendance.create({
    data: {
      userId,
      internshipId: internship.id,
      date: targetDate,
      clockIn: clockInDate,
      clockOut: clockOutDate,
      breakStart: breakStartDate,
      breakEnd: breakEndDate,
      breakMinutes,
      notes: data.notes ?? null,
    },
  });

  return formatAttendance(attendance);
}

type HttpError = Error & { statusCode: number };

function httpError(message: string, statusCode: number): HttpError {
  const err = new Error(message) as HttpError;
  err.statusCode = statusCode;
  return err;
}

interface AttendanceTimeChanges {
  clockIn?: string;
  clockOut?: string | null;
  breakStart?: string | null;
  breakEnd?: string | null;
}

function mergeAttendanceTimes(
  record: {
    clockIn: Date;
    clockOut: Date | null;
    breakStart: Date | null;
    breakEnd: Date | null;
  },
  data: AttendanceTimeChanges,
  errorPrefix = ""
) {
  const pick = (value: string | null | undefined, current: Date | null) =>
    value !== undefined ? (value ? new Date(value) : null) : current;

  const finalClockIn = data.clockIn ? new Date(data.clockIn) : record.clockIn;
  const finalClockOut = pick(data.clockOut, record.clockOut);
  const finalBreakStart = pick(data.breakStart, record.breakStart);
  const finalBreakEnd = pick(data.breakEnd, record.breakEnd);

  if (finalClockOut && finalClockOut <= finalClockIn) {
    throw httpError(`${errorPrefix}Clock out time must be later than clock in time`, 400);
  }

  if (finalBreakStart && finalBreakEnd && finalBreakEnd <= finalBreakStart) {
    throw httpError(`${errorPrefix}Break end time must be later than break start time`, 400);
  }

  let finalBreakMinutes = 0;
  if (finalBreakStart && finalBreakEnd) {
    finalBreakMinutes = Math.round((finalBreakEnd.getTime() - finalBreakStart.getTime()) / (1000 * 60));
  }

  return { finalClockIn, finalClockOut, finalBreakStart, finalBreakEnd, finalBreakMinutes };
}

export async function updateAttendance(
  userId: string,
  id: string,
  data: {
    date?: string;
    clockIn?: string;
    clockOut?: string | null;
    breakStart?: string | null;
    breakEnd?: string | null;
    notes?: string | null;
  }
): Promise<FormattedAttendance> {
  const record = await prisma.attendance.findFirst({
    where: { id, userId },
  });

  if (!record) {
    const err = new Error("Attendance record not found") as Error & {
      statusCode: number;
    };
    err.statusCode = 404;
    throw err;
  }

  let newDate = record.date;
  if (data.date) {
    newDate = new Date(`${data.date}T00:00:00.000Z`);
    if (newDate.getTime() !== record.date.getTime()) {
      const collision = await prisma.attendance.findUnique({
        where: {
          internshipId_date: {
            internshipId: record.internshipId,
            date: newDate,
          },
        },
      });
      if (collision) {
        const err = new Error("Attendance already recorded for this date in this internship") as Error & {
          statusCode: number;
        };
        err.statusCode = 400;
        throw err;
      }
    }
  }

  const {
    finalClockIn,
    finalClockOut,
    finalBreakStart,
    finalBreakEnd,
    finalBreakMinutes,
  } = mergeAttendanceTimes(record, data);

  if (!finalClockOut && record.clockOut !== null) {
    const active = await prisma.attendance.findFirst({
      where: { userId, clockOut: null, id: { not: id } },
    });
    if (active) {
      const err = new Error("User already has an active clock-in") as Error & {
        statusCode: number;
      };
      err.statusCode = 400;
      throw err;
    }
  }

  const updated = await prisma.attendance.update({
    where: { id },
    data: {
      date: newDate,
      clockIn: finalClockIn,
      clockOut: finalClockOut,
      breakStart: finalBreakStart,
      breakEnd: finalBreakEnd,
      breakMinutes: finalBreakMinutes,
      notes: data.notes !== undefined ? data.notes : record.notes,
    },
  });

  return formatAttendance(updated);
}

export async function deleteAttendance(
  userId: string,
  id: string
): Promise<void> {
  const record = await prisma.attendance.findFirst({
    where: { id, userId },
  });

  if (!record) {
    const err = new Error("Attendance record not found") as Error & {
      statusCode: number;
    };
    err.statusCode = 404;
    throw err;
  }

  await prisma.attendance.delete({
    where: { id },
  });
}

export async function batchDeleteAttendance(
  userId: string,
  ids: string[]
): Promise<{ count: number }> {
  const result = await prisma.attendance.deleteMany({
    where: {
      id: { in: ids },
      userId,
    },
  });

  return { count: result.count };
}

export async function batchUpdateAttendance(
  userId: string,
  updates: Array<AttendanceTimeChanges & { id: string; notes?: string | null }>
): Promise<FormattedAttendance[]> {
  const ids = updates.map((u) => u.id);
  if (new Set(ids).size !== ids.length) {
    throw httpError("Duplicate attendance IDs in batch update", 400);
  }

  const records = await prisma.attendance.findMany({
    where: { id: { in: ids }, userId },
  });

  if (records.length !== ids.length) {
    throw httpError("One or more attendance records were not found", 404);
  }

  const recordMap = new Map(records.map((r) => [r.id, r]));

  const prepared = updates.map((u) => {
    const record = recordMap.get(u.id)!;
    const prefix = `${record.date.toISOString().slice(0, 10)}: `;
    const merged = mergeAttendanceTimes(record, u, prefix);
    return { update: u, record, merged };
  });

  const openInBatch = prepared.filter((p) => !p.merged.finalClockOut);
  if (openInBatch.length > 0) {
    const openOutside = await prisma.attendance.count({
      where: { userId, clockOut: null, id: { notIn: ids } },
    });
    if (openInBatch.length + openOutside > 1) {
      throw httpError("User already has an active clock-in", 400);
    }
  }

  const updated = await prisma.$transaction(
    prepared.map(({ update, record, merged }) =>
      prisma.attendance.update({
        where: { id: record.id },
        data: {
          clockIn: merged.finalClockIn,
          clockOut: merged.finalClockOut,
          breakStart: merged.finalBreakStart,
          breakEnd: merged.finalBreakEnd,
          breakMinutes: merged.finalBreakMinutes,
          notes: update.notes !== undefined ? update.notes : record.notes,
        },
      })
    )
  );

  return updated.map(formatAttendance);
}
