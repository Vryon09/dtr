import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";

const SALT_ROUNDS = 12;

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
