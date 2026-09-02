import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";
import { getFederationOverview } from "../../controllers/admin/analytics.controller.js";

const router = Router();

// Require valid authentication and COOPERATIVE_ADMIN or SUPER_ADMIN role
router.use(authenticate, authorize("COOPERATIVE_ADMIN", "SUPER_ADMIN"));

router.get("/overview", getFederationOverview);

export default router;
