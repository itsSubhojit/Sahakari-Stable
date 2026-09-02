import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";
import {
  getCustomerBookings,
  getCustomerActiveBookings,
} from "../../controllers/customer/booking.controller.js";

const router = Router();

router.use(authenticate, authorize("CUSTOMER"));

router.get("/", getCustomerBookings);
router.get("/active", getCustomerActiveBookings);

export default router;
