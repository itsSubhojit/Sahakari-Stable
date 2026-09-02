import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import { getWorkerEarningsService } from "../../services/worker/earnings.service.js";

/**
 * GET /api/worker/earnings
 * Returns total earnings and COMPLETED booking breakdown for the calling worker.
 */
export const getWorkerEarnings = asyncHandler(async (req, res) => {
  const earnings = await getWorkerEarningsService(req.user.uid);
  res
    .status(200)
    .json(new ApiResponse(200, earnings, "Worker earnings fetched successfully"));
});
