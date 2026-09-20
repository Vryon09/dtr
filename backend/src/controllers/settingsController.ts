import { Request, Response } from "express";
import * as settingsService from "../services/settingsService.js";
import { UpdateSettingsInput, ChangePasswordInput } from "../schemas/settingsSchemas.js";

export async function getSettings(req: Request, res: Response): Promise<void> {
  try {
    const settings = await settingsService.getSettings(req.user!.id);
    res.status(200).json({ success: true, data: settings });
  } catch (err) {
    const e = err as Error & { statusCode?: number };
    res
      .status(e.statusCode ?? 500)
      .json({ success: false, message: e.message });
  }
}

export async function updateSettings(req: Request, res: Response): Promise<void> {
  try {
    const data = req.body as UpdateSettingsInput;
    const settings = await settingsService.updateSettings(req.user!.id, data);
    res.status(200).json({ success: true, data: settings });
  } catch (err) {
    const e = err as Error & { statusCode?: number };
    res
      .status(e.statusCode ?? 500)
      .json({ success: false, message: e.message });
  }
}

export async function changePassword(req: Request, res: Response): Promise<void> {
  try {
    const data = req.body as ChangePasswordInput;
    await settingsService.changePassword(req.user!.id, data);
    res.status(200).json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    const e = err as Error & { statusCode?: number };
    res
      .status(e.statusCode ?? 500)
      .json({ success: false, message: e.message });
  }
}
