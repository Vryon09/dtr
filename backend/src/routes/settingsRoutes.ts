import { Router } from "express";
import {
  getSettings,
  updateSettings,
  changePassword,
} from "../controllers/settingsController.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  updateSettingsSchema,
  changePasswordSchema,
} from "../schemas/settingsSchemas.js";

const router = Router();

router.use(requireAuth);

router.get("/", getSettings);
router.patch("/", validate(updateSettingsSchema), updateSettings);
router.patch("/password", validate(changePasswordSchema), changePassword);

export default router;
