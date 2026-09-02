import { Router } from "express";
import profileRoutes from "./profile.routes.js";
import nearbyRoutes from "./nearby.routes.js";
import bookingRoutes from "./booking.routes.js";
import notificationRoutes from "./notification.routes.js";

const router = Router();

// C1 — Profile
router.use("/profile", profileRoutes);

// C3 — Nearby Workers
router.use("/nearby-workers", nearbyRoutes);

// C5 — Bookings
router.use("/bookings", bookingRoutes);

// C9 — Notifications
router.use("/notifications", notificationRoutes);

export default router;
