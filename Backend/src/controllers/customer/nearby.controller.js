import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import { getNearbyWorkersService } from "../../services/customer/nearby.service.js";

/**
 * GET /api/customer/nearby-workers
 * Query params: serviceId (required), lat (required), lng (required), radius (optional, default 10)
 */
export const getNearbyWorkers = asyncHandler(async (req, res) => {
  const workers = await getNearbyWorkersService(req.query);
  res.status(200).json(new ApiResponse(200, workers, "Nearby workers retrieved successfully"));
});
