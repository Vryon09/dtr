import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { UpdateSettingsInput, ChangePasswordInput } from "../schemas/settingsSchemas.js";

const SALT_ROUNDS = 12;

export interface SettingsResponse {
  id: string;
  name: string | null;
  email: string;
  requiredHours: number;
}

export async function getSettings(userId: string): Promise<SettingsResponse> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      requiredHours: true,
    },
  });

  if (!user) {
    const err = new Error("User not found") as Error & { statusCode: number };
    err.statusCode = 404;
    throw err;
  }

  return user;
}

export async function updateSettings(
  userId: string,
  data: UpdateSettingsInput
): Promise<SettingsResponse> {
  if (data.email) {
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing && existing.id !== userId) {
      const err = new Error("Email already in use") as Error & { statusCode: number };
      err.statusCode = 409;
      throw err;
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.requiredHours !== undefined && { requiredHours: data.requiredHours }),
    },
    select: {
      id: true,
      name: true,
      email: true,
      requiredHours: true,
    },
  });

  return updatedUser;
}

export async function changePassword(
  userId: string,
  data: ChangePasswordInput
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    const err = new Error("User not found") as Error & { statusCode: number };
    err.statusCode = 404;
    throw err;
  }

  const isValid = await bcrypt.compare(data.currentPassword, user.passwordHash);
  if (!isValid) {
    const err = new Error("Incorrect current password") as Error & { statusCode: number };
    err.statusCode = 400;
    throw err;
  }

  const passwordHash = await bcrypt.hash(data.newPassword, SALT_ROUNDS);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });
}
