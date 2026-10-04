import { Router } from "express";
import {
  listInternships,
  getActiveInternship,
  createInternship,
  updateInternship,
  setActiveInternship,
  deleteInternship,
} from "../controllers/internshipController.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  createInternshipSchema,
  updateInternshipSchema,
} from "../schemas/internshipSchemas.js";

const router = Router();

router.use(requireAuth);

router.get("/", listInternships);
router.get("/active", getActiveInternship);
router.post("/", validate(createInternshipSchema), createInternship);
router.patch("/:id", validate(updateInternshipSchema), updateInternship);
router.post("/:id/activate", setActiveInternship);
router.delete("/:id", deleteInternship);

export default router;
