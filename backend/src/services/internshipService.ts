import { prisma } from "../lib/prisma.js";
import { CreateInternshipInput, UpdateInternshipInput } from "../schemas/internshipSchemas.js";

export interface InternshipSummary {
  id: string;
  userId: string;
  title: string;
  companyName: string | null;
  requiredHours: number;
  status: string;
  startDate: string | null;
  endDate: string | null;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  completedHours: number;
  remainingHours: number;
  progressPercentage: number;
  totalLogsCount: number;
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

export async function getActiveInternship(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { activeInternshipId: true, requiredHours: true },
  });

  if (!user) {
    const err = new Error("User not found") as Error & { statusCode: number };
    err.statusCode = 404;
    throw err;
  }

  let internship = null;
  if (user.activeInternshipId) {
    internship = await prisma.internship.findFirst({
      where: { id: user.activeInternshipId, userId },
    });
  }

  if (!internship) {
    internship = await prisma.internship.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  // If user still has no internship, create a default one
  if (!internship) {
    internship = await prisma.internship.create({
      data: {
        userId,
        title: "Internship 1",
        requiredHours: user.requiredHours || 300,
        status: "ACTIVE",
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { activeInternshipId: internship.id },
    });
  } else if (user.activeInternshipId !== internship.id) {
    await prisma.user.update({
      where: { id: userId },
      data: { activeInternshipId: internship.id },
    });
  }

  return internship;
}

export async function listInternships(userId: string): Promise<InternshipSummary[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { activeInternshipId: true },
  });

  const internships = await prisma.internship.findMany({
    where: { userId },
    include: {
      attendances: {
        where: { clockOut: { not: null } },
        select: {
          clockIn: true,
          clockOut: true,
          breakStart: true,
          breakEnd: true,
          breakMinutes: true,
        },
      },
      _count: {
        select: { attendances: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return internships.map((item) => {
    const totalCompletedHours = item.attendances.reduce((sum, att) => {
      if (!att.clockOut) return sum;
      return (
        sum +
        calculateRenderedHours(
          att.clockIn,
          att.clockOut,
          att.breakStart,
          att.breakEnd,
          att.breakMinutes
        )
      );
    }, 0);

    const completedHours = Math.round(totalCompletedHours * 100) / 100;
    const remainingHours =
      Math.round(Math.max(item.requiredHours - completedHours, 0) * 100) / 100;
    const progressPercentage =
      item.requiredHours > 0
        ? Math.round(Math.min((completedHours / item.requiredHours) * 100, 100) * 100) / 100
        : 0;

    return {
      id: item.id,
      userId: item.userId,
      title: item.title,
      companyName: item.companyName,
      requiredHours: item.requiredHours,
      status: item.status,
      startDate: item.startDate ? item.startDate.toISOString().split("T")[0] : null,
      endDate: item.endDate ? item.endDate.toISOString().split("T")[0] : null,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      isActive: user?.activeInternshipId === item.id,
      completedHours,
      remainingHours,
      progressPercentage,
      totalLogsCount: item._count.attendances,
    };
  });
}

export async function createInternship(
  userId: string,
  input: CreateInternshipInput
): Promise<InternshipSummary> {
  const startDate = input.startDate ? new Date(`${input.startDate}T00:00:00.000Z`) : null;
  const endDate = input.endDate ? new Date(`${input.endDate}T00:00:00.000Z`) : null;

  const internship = await prisma.internship.create({
    data: {
      userId,
      title: input.title.trim(),
      companyName: input.companyName ? input.companyName.trim() : null,
      requiredHours: input.requiredHours,
      status: "ACTIVE",
      startDate,
      endDate,
    },
  });

  // Automatically make new internship the active one
  await prisma.user.update({
    where: { id: userId },
    data: { activeInternshipId: internship.id },
  });

  return {
    id: internship.id,
    userId: internship.userId,
    title: internship.title,
    companyName: internship.companyName,
    requiredHours: internship.requiredHours,
    status: internship.status,
    startDate: input.startDate ?? null,
    endDate: input.endDate ?? null,
    createdAt: internship.createdAt,
    updatedAt: internship.updatedAt,
    isActive: true,
    completedHours: 0,
    remainingHours: internship.requiredHours,
    progressPercentage: 0,
    totalLogsCount: 0,
  };
}

export async function updateInternship(
  userId: string,
  internshipId: string,
  input: UpdateInternshipInput
) {
  const existing = await prisma.internship.findFirst({
    where: { id: internshipId, userId },
  });

  if (!existing) {
    const err = new Error("Internship not found") as Error & { statusCode: number };
    err.statusCode = 404;
    throw err;
  }

  const startDate =
    input.startDate !== undefined
      ? input.startDate
        ? new Date(`${input.startDate}T00:00:00.000Z`)
        : null
      : undefined;

  const endDate =
    input.endDate !== undefined
      ? input.endDate
        ? new Date(`${input.endDate}T00:00:00.000Z`)
        : null
      : undefined;

  return prisma.internship.update({
    where: { id: internshipId },
    data: {
      ...(input.title && { title: input.title.trim() }),
      ...(input.companyName !== undefined && {
        companyName: input.companyName ? input.companyName.trim() : null,
      }),
      ...(input.requiredHours && { requiredHours: input.requiredHours }),
      ...(input.status && { status: input.status }),
      ...(startDate !== undefined && { startDate }),
      ...(endDate !== undefined && { endDate }),
    },
  });
}

export async function setActiveInternship(userId: string, internshipId: string) {
  const existing = await prisma.internship.findFirst({
    where: { id: internshipId, userId },
  });

  if (!existing) {
    const err = new Error("Internship not found") as Error & { statusCode: number };
    err.statusCode = 404;
    throw err;
  }

  await prisma.user.update({
    where: { id: userId },
    data: { activeInternshipId: internshipId },
  });

  return existing;
}

export async function deleteInternship(userId: string, internshipId: string) {
  const existing = await prisma.internship.findFirst({
    where: { id: internshipId, userId },
  });

  if (!existing) {
    const err = new Error("Internship not found") as Error & { statusCode: number };
    err.statusCode = 404;
    throw err;
  }

  const count = await prisma.internship.count({
    where: { userId },
  });

  if (count <= 1) {
    const err = new Error(
      "Cannot delete your only internship. You must have at least one internship profile."
    ) as Error & { statusCode: number };
    err.statusCode = 400;
    throw err;
  }

  // If deleting active internship, switch to another one first
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { activeInternshipId: true },
  });

  if (user?.activeInternshipId === internshipId) {
    const alternate = await prisma.internship.findFirst({
      where: { userId, id: { not: internshipId } },
      orderBy: { createdAt: "desc" },
    });
    if (alternate) {
      await prisma.user.update({
        where: { id: userId },
        data: { activeInternshipId: alternate.id },
      });
    }
  }

  await prisma.internship.delete({
    where: { id: internshipId },
  });

  return { success: true };
}
