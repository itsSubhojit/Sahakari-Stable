import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";
import { triggerSosAlert } from "../../controllers/worker/sos.controller.js";

const router = Router();

// POST /api/worker/sos
router.post("/", authenticate, authorize("GIG_WORKER"), triggerSosAlert);

export default router;
