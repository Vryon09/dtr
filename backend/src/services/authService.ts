import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { sendPasswordResetEmail } from "./emailService.js";

const SALT_ROUNDS = 12;
const RESET_TOKEN_EXPIRY_HOURS = 1;

export interface SafeUser {
  id: string;
  email: string;
  name: string | null;
  requiredHours: number;
  createdAt: Date;
  updatedAt: Date;
}

function stripHash(user: {
  id: string;
  email: string;
  passwordHash: string;
  name: string | null;
  requiredHours: number;
  createdAt: Date;
  updatedAt: Date;
}): SafeUser {
  const { passwordHash: _omit, ...safe } = user;
  return safe;
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function register(
  email: string,
  password: string,
  requiredHours: number,
  name?: string
): Promise<SafeUser> {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const err = new Error("Email already in use") as Error & { statusCode: number };
    err.statusCode = 409;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: { email, passwordHash, name: name ?? null, requiredHours },
  });

  return stripHash(user);
}

export async function login(email: string, password: string): Promise<SafeUser> {
  const user = await prisma.user.findUnique({ where: { email } });

  // Constant-time check even when user not found
  const dummyHash = "$2a$12$invalidhashpadding000000000000000000000000000000000000000";
  const isValid = user
    ? await bcrypt.compare(password, user.passwordHash)
    : await bcrypt.compare(password, dummyHash).then(() => false);

  if (!user || !isValid) {
    const err = new Error("Invalid email or password") as Error & { statusCode: number };
    err.statusCode = 401;
    throw err;
  }

  return stripHash(user);
}

export async function getMe(userId: string): Promise<SafeUser> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    const err = new Error("User not found") as Error & { statusCode: number };
    err.statusCode = 404;
    throw err;
  }
  return stripHash(user);
}

export async function requestPasswordReset(email: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.log(`[Auth] Password reset requested for non-existent email: ${email}`);
    // Avoid email enumeration: return silently
    return;
  }

  // Invalidate any existing reset tokens for this user
  await prisma.passwordResetToken.deleteMany({
    where: { userId: user.id },
  });

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
    },
  });

  const clientBaseUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const resetUrl = `${clientBaseUrl}/reset-password?token=${rawToken}`;

  await sendPasswordResetEmail({
    to: user.email,
    name: user.name,
    resetUrl,
  });
}

export async function resetPassword(rawToken: string, newPassword: string): Promise<void> {
  const tokenHash = hashToken(rawToken);

  const resetRecord = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!resetRecord || resetRecord.expiresAt < new Date()) {
    const err = new Error("Invalid or expired password reset link") as Error & {
      statusCode: number;
    };
    err.statusCode = 400;
    throw err;
  }

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetRecord.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.deleteMany({
      where: { userId: resetRecord.userId },
    }),
  ]);
}
