import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import { createCustomerReviewService } from "../../services/customer/review.service.js";

/**
 * POST /api/reviews
 * Creates a customer review for a completed booking and updates worker rating.
 */
export const createReview = asyncHandler(async (req, res) => {
  const review = await createCustomerReviewService(req.user, req.body);
  res.status(201).json(new ApiResponse(201, review, "Review submitted successfully"));
});
