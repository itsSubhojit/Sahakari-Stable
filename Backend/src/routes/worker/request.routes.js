import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";
import { getNearbyRequests } from "../../controllers/worker/request.controller.js";

const router = Router();

// Protect nearby requests endpoint with authentication and GIG_WORKER role
router.use(authenticate, authorize("GIG_WORKER"));

router.get("/nearby", getNearbyRequests);

export default router;
