import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import {
  createRazorpayOrderService,
  verifyRazorpayPaymentService,
} from "../../services/customer/payment.service.js";

/**
 * POST /api/payments/create-order
 * Creates a Razorpay order for a booking.
 */
export const createOrder = asyncHandler(async (req, res) => {
  const orderDetails = await createRazorpayOrderService(req.user, req.body.bookingId);
  res.status(200).json(new ApiResponse(200, orderDetails, "Razorpay order created successfully"));
});

/**
 * POST /api/payments/verify
 * Verifies Razorpay payment signature, updates booking to CONFIRMED, and creates payment document.
 */
export const verifyPayment = asyncHandler(async (req, res) => {
  const result = await verifyRazorpayPaymentService(req.user, req.body);
  res.status(200).json(new ApiResponse(200, result, "Payment verified and booking confirmed successfully"));
});
