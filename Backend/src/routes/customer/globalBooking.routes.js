import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";
import {
  getBookingById,
  cancelBooking,
} from "../../controllers/customer/booking.controller.js";

const router = Router();

// Allowed for both CUSTOMER and GIG_WORKER participants
router.use(authenticate, authorize("CUSTOMER", "GIG_WORKER"));

router.get("/:id", getBookingById);
router.post("/:id/cancel", cancelBooking);

export default router;
