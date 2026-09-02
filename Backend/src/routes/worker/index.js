import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";
import { getWorkerEarnings } from "../../controllers/worker/earnings.controller.js";
import profileRoutes from "./profile.routes.js";
import documentRoutes from "./document.routes.js";
import availabilityRoutes from "./availability.routes.js";
import requestRoutes from "./request.routes.js";
import sosRoutes from "./sos.routes.js";
import bankRoutes from "./bank.routes.js";
import insuranceRoutes from "./insurance.routes.js";

const router = Router();

// W6 — Earnings (read-only)
router.get("/earnings", authenticate, authorize("GIG_WORKER"), getWorkerEarnings);

// W4 — Nearby Requests
router.use("/requests", requestRoutes);

// SOS
router.use("/sos", sosRoutes);

// W11 — Bank Details
router.use("/bank-details", bankRoutes);

// W12 — Insurance Claims
router.use("/insurance-claims", insuranceRoutes);

// W3 — Availability & Location
router.use("/", availabilityRoutes);

// W2 — KYC Document Upload
router.use("/documents", documentRoutes);

// W1 — Profile & Verification Status
router.use("/", profileRoutes);

export default router;
