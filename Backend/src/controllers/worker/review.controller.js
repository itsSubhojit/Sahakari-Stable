import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import { createWorkerReviewService } from "../../services/worker/review.service.js";

/**
 * POST /api/bookings/:id/reviews
 * Worker submits a review for a completed booking.
 */
export const createWorkerReview = asyncHandler(async (req, res) => {
  const review = await createWorkerReviewService(
    req.user.uid,
    req.params.id,
    req.body
  );
  res
    .status(201)
    .json(new ApiResponse(201, review, "Review submitted successfully"));
});
