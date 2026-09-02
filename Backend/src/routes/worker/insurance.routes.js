import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";
import { upload } from "../../middlewares/upload.middleware.js";
import {
  submitClaim,
  listClaims,
  getClaim,
} from "../../controllers/worker/insurance.controller.js";

const router = Router();

// Protect all insurance claim endpoints
router.use(authenticate, authorize("GIG_WORKER"));

// POST /api/worker/insurance-claims — multipart, up to 10 evidence files
router.post("/", upload.array("evidence", 10), submitClaim);

// GET /api/worker/insurance-claims — list own claims
router.get("/", listClaims);

// GET /api/worker/insurance-claims/:id — single claim with signed URLs
router.get("/:id", getClaim);

export default router;
