import { Request, Response } from "express";
import * as internshipService from "../services/internshipService.js";
import { CreateInternshipInput, UpdateInternshipInput } from "../schemas/internshipSchemas.js";

export async function listInternships(req: Request, res: Response): Promise<void> {
  try {
    const list = await internshipService.listInternships(req.user!.id);
    res.status(200).json({ success: true, data: list });
  } catch (err) {
    const e = err as Error & { statusCode?: number };
    res.status(e.statusCode ?? 500).json({ success: false, message: e.message });
  }
}

export async function getActiveInternship(req: Request, res: Response): Promise<void> {
  try {
    const active = await internshipService.getActiveInternship(req.user!.id);
    res.status(200).json({ success: true, data: active });
  } catch (err) {
    const e = err as Error & { statusCode?: number };
    res.status(e.statusCode ?? 500).json({ success: false, message: e.message });
  }
}

export async function createInternship(req: Request, res: Response): Promise<void> {
  try {
    const input = req.body as CreateInternshipInput;
    const created = await internshipService.createInternship(req.user!.id, input);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    const e = err as Error & { statusCode?: number };
    res.status(e.statusCode ?? 500).json({ success: false, message: e.message });
  }
}

export async function updateInternship(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    const input = req.body as UpdateInternshipInput;
    const updated = await internshipService.updateInternship(req.user!.id, id, input);
    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    const e = err as Error & { statusCode?: number };
    res.status(e.statusCode ?? 500).json({ success: false, message: e.message });
  }
}

export async function setActiveInternship(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    const active = await internshipService.setActiveInternship(req.user!.id, id);
    res.status(200).json({
      success: true,
      data: active,
      message: "Active internship updated successfully",
    });
  } catch (err) {
    const e = err as Error & { statusCode?: number };
    res.status(e.statusCode ?? 500).json({ success: false, message: e.message });
  }
}

export async function deleteInternship(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    await internshipService.deleteInternship(req.user!.id, id);
    res.status(200).json({
      success: true,
      message: "Internship profile deleted successfully",
    });
  } catch (err) {
    const e = err as Error & { statusCode?: number };
    res.status(e.statusCode ?? 500).json({ success: false, message: e.message });
  }
}
