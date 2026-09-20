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

function calculateRenderedHours(clockIn: Date, clockOut: Date): number {
  const diffMs = clockOut.getTime() - clockIn.getTime();
  const hours = diffMs / (1000 * 60 * 60);
  return Math.round(hours * 100) / 100;
}

function formatAttendance(attendance: {
  id: string;
  userId: string;
  date: Date;
  clockIn: Date;
  clockOut: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}): FormattedAttendance {
  const renderedHours = attendance.clockOut
    ? calculateRenderedHours(attendance.clockIn, attendance.clockOut)
    : null;

  return {
    ...attendance,
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
      notes: notes ?? null,
    },
  });

  return formatAttendance(attendance);
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

  const updated = await prisma.attendance.update({
    where: { id: active.id },
    data: { clockOut: now },
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
    const hours =
      (att.clockOut.getTime() - att.clockIn.getTime()) / (1000 * 60 * 60);
    return sum + hours;
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
    notes?: string;
  }
): Promise<FormattedAttendance> {
  const targetDate = new Date(`${data.date}T00:00:00.000Z`);
  const clockInDate = new Date(data.clockIn);
  const clockOutDate = data.clockOut ? new Date(data.clockOut) : null;

  if (clockOutDate && clockOutDate <= clockInDate) {
    const err = new Error("Clock out time must be later than clock in time") as Error & {
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

  const attendance = await prisma.attendance.create({
    data: {
      userId,
      date: targetDate,
      clockIn: clockInDate,
      clockOut: clockOutDate,
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

  if (finalClockOut && finalClockOut <= finalClockIn) {
    const err = new Error("Clock out time must be later than clock in time") as Error & {
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

  const updated = await prisma.attendance.update({
    where: { id },
    data: {
      date: newDate,
      clockIn: finalClockIn,
      clockOut: finalClockOut,
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
