import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import {
  getWorkerProfile,
  updateWorkerProfile,
  getWorkerVerificationStatus,
} from "../../services/worker/profile.service.js";

/**
 * GET /api/worker/profile
 * Retrieves the authenticated worker's profile.
 */
export const getProfile = asyncHandler(async (req, res) => {
  const profile = await getWorkerProfile(req.user.uid);
  res.status(200).json(new ApiResponse(200, profile, "Worker profile fetched successfully"));
});

/**
 * PATCH /api/worker/profile
 * Updates allowed fields on the authenticated worker's profile document.
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const updatedProfile = await updateWorkerProfile(req.user.uid, req.body);
  res.status(200).json(new ApiResponse(200, updatedProfile, "Worker profile updated successfully"));
});

/**
 * GET /api/worker/verification-status
 * Retrieves the verification status details for the authenticated worker.
 */
export const getVerificationStatus = asyncHandler(async (req, res) => {
  const statusInfo = await getWorkerVerificationStatus(req.user.uid);
  res
    .status(200)
    .json(new ApiResponse(200, statusInfo, "Worker verification status fetched successfully"));
});
