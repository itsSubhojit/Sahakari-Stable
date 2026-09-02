import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";
import { updateWorkerBankDetails } from "../../controllers/worker/bank.controller.js";

const router = Router();

// PATCH /api/worker/bank-details
router.patch("/", authenticate, authorize("GIG_WORKER"), updateWorkerBankDetails);

export default router;
