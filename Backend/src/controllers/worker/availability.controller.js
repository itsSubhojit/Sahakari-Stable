import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import {
  updateWorkerAvailabilityService,
  updateWorkerLocationService,
} from "../../services/worker/availability.service.js";

/**
 * PATCH /api/worker/availability
 * Toggles worker availability status (ONLINE / OFFLINE).
 */
export const updateAvailability = asyncHandler(async (req, res) => {
  const updatedProfile = await updateWorkerAvailabilityService(req.user.uid, req.body);
  res
    .status(200)
    .json(new ApiResponse(200, updatedProfile, "Worker availability updated successfully"));
});

/**
 * PATCH /api/worker/location
 * Updates worker live coordinates { lat, lng }.
 */
export const updateLocation = asyncHandler(async (req, res) => {
  const updatedProfile = await updateWorkerLocationService(req.user.uid, req.body);
  res
    .status(200)
    .json(new ApiResponse(200, updatedProfile, "Worker location updated successfully"));
});
