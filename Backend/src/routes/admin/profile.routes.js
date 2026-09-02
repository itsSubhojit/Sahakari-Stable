import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";
import { getAdminProfile } from "../../controllers/admin/profile.controller.js";

const router = Router();

// Require valid authentication and admin role (COOPERATIVE_ADMIN or SUPER_ADMIN)
router.use(authenticate, authorize("COOPERATIVE_ADMIN", "SUPER_ADMIN"));

router.get("/", getAdminProfile);

export default router;
