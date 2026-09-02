import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";
import {
  updateAvailability,
  updateLocation,
} from "../../controllers/worker/availability.controller.js";

const router = Router();

// Protect all worker availability & location endpoints with authentication and GIG_WORKER role
router.use(authenticate, authorize("GIG_WORKER"));

router.patch("/availability", updateAvailability);
router.patch("/location", updateLocation);

export default router;
