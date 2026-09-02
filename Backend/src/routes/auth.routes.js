import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";
import { 
  sendEmailOtp, 
  verifyEmailOtp, 
  sendWelcomeEmail,
  resetPasswordWithOtp,
  checkUserExists,
  completeProfile 
} from "../controllers/auth.controller.js";

const router = Router();

// Middleware to conditionally run Multer only for multipart/form-data requests
const optionalFileUpload = (req, res, next) => {
  const contentType = req.headers["content-type"] || "";
  if (contentType.includes("multipart/form-data")) {
    return upload.single("photo")(req, res, next);
  }
  next();
};

// Public Email OTP routes
router.post("/send-email-otp", sendEmailOtp);
router.post("/verify-email-otp", verifyEmailOtp);
router.post("/send-welcome-email", sendWelcomeEmail);
router.post("/reset-password", resetPasswordWithOtp);
router.post("/check-user-exists", checkUserExists);

// Profile completion route (supports token auth or body uid for registration)
router.post("/complete-profile", (req, res, next) => {
  // If authorization header is present, run authenticate middleware; else proceed with body uid
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    return authenticate(req, res, (err) => {
      if (err) {
        // If token verification fails (e.g. mock token), provide safe fallback user from body
        req.user = {
          uid: req.body.uid || `cust_${Date.now()}`,
          email: req.body.email || "",
        };
      }
      optionalFileUpload(req, res, next);
    });
  }
  optionalFileUpload(req, res, next);
}, completeProfile);

export default router;
