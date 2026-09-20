import { CookieOptions, Request, Response } from "express";
import jwt from "jsonwebtoken";
import * as authService from "../services/authService.js";

const COOKIE_NAME = "token";

function cookieOptions(maxAge?: number): CookieOptions {
  return {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    secure: process.env.NODE_ENV === "production",
    ...(maxAge !== undefined ? { maxAge } : {}),
  };
}

function signToken(userId: string): string {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN ?? "7d";
  if (!secret) throw new Error("JWT_SECRET not configured");
  return jwt.sign({ userId }, secret, { expiresIn } as jwt.SignOptions);
}

export async function register(req: Request, res: Response): Promise<void> {
  const { email, password, name, requiredHours } = req.body as {
    email?: unknown;
    password?: unknown;
    name?: unknown;
    requiredHours?: unknown;
  };

  if (typeof email !== "string" || !email.includes("@")) {
    res.status(400).json({ success: false, message: "Valid email required" });
    return;
  }
  if (typeof password !== "string" || password.length < 8) {
    res.status(400).json({
      success: false,
      message: "Password must be at least 8 characters",
    });
    return;
  }
  const parsedHours = Number(requiredHours);
  if (!Number.isInteger(parsedHours) || parsedHours < 1) {
    res.status(400).json({
      success: false,
      message: "Required hours must be an integer of at least 1",
    });
    return;
  }

  try {
    const user = await authService.register(
      email.toLowerCase().trim(),
      password,
      parsedHours,
      typeof name === "string" ? name.trim() || undefined : undefined,
    );

    const token = signToken(user.id);
    res.cookie(COOKIE_NAME, token, cookieOptions(7 * 24 * 60 * 60 * 1000));
    res.status(201).json({ success: true, data: user });
  } catch (err) {
    const e = err as Error & { statusCode?: number };
    res
      .status(e.statusCode ?? 500)
      .json({ success: false, message: e.message });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as {
    email?: unknown;
    password?: unknown;
  };

  if (typeof email !== "string" || typeof password !== "string") {
    res
      .status(400)
      .json({ success: false, message: "Email and password required" });
    return;
  }

  try {
    const user = await authService.login(email.toLowerCase().trim(), password);

    const token = signToken(user.id);
    res.cookie(COOKIE_NAME, token, cookieOptions(7 * 24 * 60 * 60 * 1000));
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    const e = err as Error & { statusCode?: number };
    res
      .status(e.statusCode ?? 500)
      .json({ success: false, message: e.message });
  }
}

export async function logout(_req: Request, res: Response): Promise<void> {
  res.clearCookie(COOKIE_NAME, cookieOptions());
  res.status(200).json({ success: true, message: "Logged out" });
}

export async function me(req: Request, res: Response): Promise<void> {
  try {
    // req.user.id is set by requireAuth middleware — never trust client input
    const user = await authService.getMe(req.user!.id);
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    const e = err as Error & { statusCode?: number };
    res
      .status(e.statusCode ?? 500)
      .json({ success: false, message: e.message });
  }
}
