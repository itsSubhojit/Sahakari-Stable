import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";
import { updateBookingStatus } from "../../controllers/worker/booking.controller.js";
import { createWorkerReview } from "../../controllers/worker/review.controller.js";

const router = Router();

router.use(authenticate, authorize("GIG_WORKER"));

// PATCH /api/bookings/:id/status — worker advances booking through lifecycle
router.patch("/:id/status", updateBookingStatus);

// POST /api/bookings/:id/reviews — worker reviews customer after completion
router.post("/:id/reviews", createWorkerReview);

export default router;
