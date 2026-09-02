import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";
import {
  getAdminBookings,
  getAdminBookingById,
} from "../../controllers/admin/booking.controller.js";

const router = Router();

// All admin booking routes require valid token and COOPERATIVE_ADMIN or SUPER_ADMIN role
router.use(authenticate, authorize("COOPERATIVE_ADMIN", "SUPER_ADMIN"));

router.get("/", getAdminBookings);
router.get("/:id", getAdminBookingById);

export default router;
