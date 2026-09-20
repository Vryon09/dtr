import { Router } from "express";
import {
  clockIn,
  clockOut,
  getToday,
  getHistory,
  getSummary,
  createManual,
  updateAttendance,
  deleteAttendance,
} from "../controllers/attendanceController.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  clockInSchema,
  createManualAttendanceSchema,
  updateAttendanceSchema,
} from "../schemas/attendanceSchemas.js";

const router = Router();

router.use(requireAuth);

router.post("/clock-in", validate(clockInSchema), clockIn);
router.post("/clock-out", clockOut);
router.post("/manual", validate(createManualAttendanceSchema), createManual);
router.put("/:id", validate(updateAttendanceSchema), updateAttendance);
router.delete("/:id", deleteAttendance);
router.get("/today", getToday);
router.get("/summary", getSummary);
router.get("/", getHistory);

export default router;
