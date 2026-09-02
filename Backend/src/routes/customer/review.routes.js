import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";
import { createReview } from "../../controllers/customer/review.controller.js";

const router = Router();

router.use(authenticate, authorize("CUSTOMER"));

router.post("/", createReview);

export default router;
