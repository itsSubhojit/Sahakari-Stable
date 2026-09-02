import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import { completeProfileService } from "../services/auth.service.js";
import { 
  sendEmailOtpService, 
  verifyEmailOtpService, 
  sendWelcomeEmailService,
  resetPasswordWithOtpService,
  checkUserExistsService
} from "../services/emailOtp.service.js";

/**
 * POST /api/auth/send-email-otp
 * Generates and sends a 6-digit verification code (valid for 5 minutes) to the given email address.
 */
export const sendEmailOtp = asyncHandler(async (req, res) => {
  const { email, name, purpose } = req.body;
  const result = await sendEmailOtpService(email, name, purpose);
  res.status(200).json(new ApiResponse(200, result, "OTP sent successfully"));
});

/**
 * POST /api/auth/verify-email-otp
 * Verifies the 6-digit OTP code against the email address.
 */
export const verifyEmailOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  const result = await verifyEmailOtpService(email, otp);
  res.status(200).json(new ApiResponse(200, result, "OTP verified successfully"));
});

/**
 * POST /api/auth/send-welcome-email
 * Sends welcome email to customer upon successful signup.
 */
export const sendWelcomeEmail = asyncHandler(async (req, res) => {
  const { email, name } = req.body;
  const result = await sendWelcomeEmailService(email, name);
  res.status(200).json(new ApiResponse(200, result, "Welcome email sent successfully"));
});

/**
 * POST /api/auth/check-user-exists
 * Checks if a user account exists in database or auth.
 */
export const checkUserExists = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const result = await checkUserExistsService(email);
  res.status(200).json(new ApiResponse(200, result, "User check completed"));
});

/**
 * POST /api/auth/reset-password
 * Resets user password using verified OTP and sends security notification email.
 */
export const resetPasswordWithOtp = asyncHandler(async (req, res) => {
  const { email, newPassword } = req.body;
  const result = await resetPasswordWithOtpService(email, newPassword);
  res.status(200).json(new ApiResponse(200, result, "Password reset successfully"));
});

/**
 * POST /api/auth/complete-profile
 * Completes user registration by creating a customer or worker document in Firestore.
 */
export const completeProfile = asyncHandler(async (req, res) => {
  const user = req.user || {
    uid: req.body.uid || `cust_${Date.now()}`,
    email: req.body.email || "",
  };
  const profile = await completeProfileService(user, req.body, req.file);
  res.status(201).json(new ApiResponse(201, profile, "Profile completed successfully"));
});
