import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";
import {
  counterNegotiation,
  acceptNegotiation,
  rejectNegotiation,
} from "../../controllers/customer/negotiation.controller.js";

const router = Router();

// Allow both CUSTOMER and GIG_WORKER roles. Per-thread ownership is checked in negotiation.service.js
router.use(authenticate, authorize("CUSTOMER", "GIG_WORKER"));

router.post("/:id/counter", counterNegotiation);
router.post("/:id/accept", acceptNegotiation);
router.post("/:id/reject", rejectNegotiation);

export default router;
