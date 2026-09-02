import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";
import {
  getPendingVerificationWorkers,
  getWorkerDocumentsAdmin,
  verifyWorker,
} from "../../controllers/admin/worker.controller.js";

const router = Router();

// All worker administration routes require authentication and COOPERATIVE_ADMIN or SUPER_ADMIN role
router.use(authenticate, authorize("COOPERATIVE_ADMIN", "SUPER_ADMIN"));

router.get("/pending-verification", getPendingVerificationWorkers);
router.get("/:id/documents", getWorkerDocumentsAdmin);
router.patch("/:id/verify", verifyWorker);

export default router;
