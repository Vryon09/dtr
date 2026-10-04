import { Router } from "express";
import multer from "multer";
import {
  clockIn,
  startBreak,
  endBreak,
  clockOut,
  getToday,
  getHistory,
  getSummary,
  createManual,
  updateAttendance,
  deleteAttendance,
  batchDeleteAttendance,
  batchUpdateAttendance,
} from "../controllers/attendanceController.js";
import { parseDtr, bulkImport } from "../controllers/dtrUploadController.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  clockInSchema,
  createManualAttendanceSchema,
  updateAttendanceSchema,
  batchDeleteAttendanceSchema,
  batchUpdateAttendanceSchema,
} from "../schemas/attendanceSchemas.js";
import { bulkImportSchema } from "../schemas/dtrUploadSchemas.js";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.use(requireAuth);

router.post("/clock-in", validate(clockInSchema), clockIn);
router.post("/break-start", startBreak);
router.post("/break-end", endBreak);
router.post("/clock-out", clockOut);
router.post("/manual", validate(createManualAttendanceSchema), createManual);
router.post("/parse-dtr", upload.single("dtrImage"), parseDtr);
router.post("/bulk-import", validate(bulkImportSchema), bulkImport);
router.post("/batch-delete", validate(batchDeleteAttendanceSchema), batchDeleteAttendance);
router.post("/batch-update", validate(batchUpdateAttendanceSchema), batchUpdateAttendance);
router.put("/:id", validate(updateAttendanceSchema), updateAttendance);
router.delete("/:id", deleteAttendance);
router.get("/today", getToday);
router.get("/summary", getSummary);
router.get("/", getHistory);

export default router;


