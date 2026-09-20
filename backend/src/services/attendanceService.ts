import { prisma } from "../lib/prisma.js";

export interface FormattedAttendance {
  id: string;
  userId: string;
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

  const todayAttendance = await prisma.attendance.findUnique({
    where: {
      userId_date: {
        userId,
        date: todayDate,
      },
    },
  });
  if (todayAttendance) {
    const err = new Error(
      "Attendance already recorded for today"
    ) as Error & { statusCode: number };
    err.statusCode = 400;
    throw err;
  }

  const attendance = await prisma.attendance.create({
    data: {
      userId,
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

  // Auto-close open break if user clocks out while on break
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
  userId: string
): Promise<FormattedAttendance | null> {
  const todayDate = getManilaDate();
  const attendance = await prisma.attendance.findUnique({
    where: {
      userId_date: {
        userId,
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
  userId: string
): Promise<FormattedAttendance[]> {
  const attendances = await prisma.attendance.findMany({
    where: { userId },
    orderBy: { date: "desc" },
  });

  return attendances.map(formatAttendance);
}

export async function getSummary(
  userId: string
): Promise<AttendanceSummary> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { requiredHours: true },
  });

  if (!user) {
    const err = new Error("User not found") as Error & { statusCode: number };
    err.statusCode = 404;
    throw err;
  }

  const completedAttendances = await prisma.attendance.findMany({
    where: {
      userId,
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
    Math.round(Math.max(user.requiredHours - completedHours, 0) * 100) / 100;
  const progressPercentage =
    user.requiredHours > 0
      ? Math.round(
          Math.min((completedHours / user.requiredHours) * 100, 100) * 100
        ) / 100
      : 0;

  return {
    requiredHours: user.requiredHours,
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

  const existing = await prisma.attendance.findUnique({
    where: {
      userId_date: {
        userId,
        date: targetDate,
      },
    },
  });

  if (existing) {
    const err = new Error("Attendance already recorded for this date") as Error & {
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
          userId_date: {
            userId,
            date: newDate,
          },
        },
      });
      if (collision) {
        const err = new Error("Attendance already recorded for this date") as Error & {
          statusCode: number;
        };
        err.statusCode = 400;
        throw err;
      }
    }
  }

  const finalClockIn = data.clockIn ? new Date(data.clockIn) : record.clockIn;
  const finalClockOut =
    data.clockOut !== undefined
      ? data.clockOut
        ? new Date(data.clockOut)
        : null
      : record.clockOut;

  const finalBreakStart =
    data.breakStart !== undefined
      ? data.breakStart
        ? new Date(data.breakStart)
        : null
      : record.breakStart;

  const finalBreakEnd =
    data.breakEnd !== undefined
      ? data.breakEnd
        ? new Date(data.breakEnd)
        : null
      : record.breakEnd;

  if (finalClockOut && finalClockOut <= finalClockIn) {
    const err = new Error("Clock out time must be later than clock in time") as Error & {
      statusCode: number;
    };
    err.statusCode = 400;
    throw err;
  }

  if (finalBreakStart && finalBreakEnd && finalBreakEnd <= finalBreakStart) {
    const err = new Error("Break end time must be later than break start time") as Error & {
      statusCode: number;
    };
    err.statusCode = 400;
    throw err;
  }

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

  let finalBreakMinutes = 0;
  if (finalBreakStart && finalBreakEnd) {
    finalBreakMinutes = Math.round((finalBreakEnd.getTime() - finalBreakStart.getTime()) / (1000 * 60));
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
