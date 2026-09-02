import { Router } from "express";
import profileRoutes from "./profile.routes.js";
import workerRoutes from "./worker.routes.js";
import federationRoutes from "./federation.routes.js";
import analyticsRoutes from "./analytics.routes.js";
import bookingRoutes from "./booking.routes.js";
import serviceRoutes from "./service.routes.js";
import cooperativeRoutes from "./cooperative.routes.js";
import insuranceRoutes from "./insurance.routes.js";
import sosRoutes from "./sos.routes.js";

const router = Router();

// A1 — Profile
router.use("/profile", profileRoutes);

// A2 — Worker Verification & Skills Oversight
router.use("/workers", workerRoutes);

// A3 — Federation Administration Dashboard
router.use("/federation", federationRoutes);

// A6 — Financial & Transaction Analytics
router.use("/analytics", analyticsRoutes);

// A4 — Booking Management & Oversight
router.use("/bookings", bookingRoutes);

// A5 — Service Catalog Management
router.use("/services", serviceRoutes);

// A7 — Cooperative Federation Entity Management
router.use("/cooperatives", cooperativeRoutes);

// A8 — Worker Welfare & Insurance Claims Review
router.use("/insurance-claims", insuranceRoutes);

// A9 — Emergency & Safety Alert Monitoring
router.use("/sos", sosRoutes);
router.use("/safety-alerts", sosRoutes);

export default router;
