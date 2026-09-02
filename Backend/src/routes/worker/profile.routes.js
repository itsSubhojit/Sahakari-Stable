import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";
import {
  getProfile,
  updateProfile,
  getVerificationStatus,
} from "../../controllers/worker/profile.controller.js";

const router = Router();

// Protect all worker profile endpoints: must be authenticated and have GIG_WORKER role
router.use(authenticate, authorize("GIG_WORKER"));

router.get("/profile", getProfile);
router.patch("/profile", updateProfile);
router.get("/verification-status", getVerificationStatus);

export default router;
