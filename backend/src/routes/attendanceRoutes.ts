import { Router } from "express";
import {
  clockIn,
  clockOut,
  getToday,
  getHistory,
  getSummary,
} from "../controllers/attendanceController.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { clockInSchema } from "../schemas/attendanceSchemas.js";

const router = Router();

router.use(requireAuth);

router.post("/clock-in", validate(clockInSchema), clockIn);
router.post("/clock-out", clockOut);
router.get("/today", getToday);
router.get("/summary", getSummary);
router.get("/", getHistory);

export default router;
