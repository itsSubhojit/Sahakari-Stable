import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";
import { createOrder, verifyPayment } from "../../controllers/customer/payment.controller.js";

const router = Router();

router.use(authenticate, authorize("CUSTOMER"));

router.post("/create-order", createOrder);
router.post("/verify", verifyPayment);

export default router;
