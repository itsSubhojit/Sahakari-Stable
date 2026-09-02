import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";
import {
  getAdminInsuranceClaims,
  getAdminInsuranceClaimById,
  updateAdminInsuranceClaimStatus,
} from "../../controllers/admin/insurance.controller.js";

const router = Router();

// Require valid authentication and COOPERATIVE_ADMIN or SUPER_ADMIN role
router.use(authenticate, authorize("COOPERATIVE_ADMIN", "SUPER_ADMIN"));

router.get("/", getAdminInsuranceClaims);
router.get("/:id", getAdminInsuranceClaimById);
router.patch("/:id/status", updateAdminInsuranceClaimStatus);

export default router;
