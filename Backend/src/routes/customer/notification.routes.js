import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";
import { getNotifications, markNotificationRead, sendInvoiceEmail } from "../../controllers/customer/notification.controller.js";

const router = Router();

// Public route for invoice dispatch (since OTP login users might not have a JWT token)
router.post("/send-invoice", sendInvoiceEmail);

// All other notification routes require a valid token AND the CUSTOMER role
router.use(authenticate, authorize("CUSTOMER"));

router.get("/", getNotifications);                // GET  /api/customer/notifications[?unread=true]
router.patch("/:id/read", markNotificationRead);  // PATCH /api/customer/notifications/:id/read

export default router;
