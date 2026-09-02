import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";
import {
  getAdminSosAlerts,
  getAdminSosAlertById,
  resolveAdminSosAlert,
} from "../../controllers/admin/sos.controller.js";

const router = Router();

// Require valid authentication and COOPERATIVE_ADMIN or SUPER_ADMIN role
router.use(authenticate, authorize("COOPERATIVE_ADMIN", "SUPER_ADMIN"));

// Route patterns for /alerts and root /
router.get("/alerts", getAdminSosAlerts);
router.get("/alerts/:id", getAdminSosAlertById);
router.patch("/alerts/:id/resolve", resolveAdminSosAlert);

// Fallback aliases for direct / and /:id
router.get("/", getAdminSosAlerts);
router.get("/:id", getAdminSosAlertById);
router.patch("/:id/resolve", resolveAdminSosAlert);

export default router;
