import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import ApiError from "../../utils/ApiError.js";
import {
  getCustomerProfile,
  updateCustomerProfile,
  updateCustomerProfileImageService,
} from "../../services/customer/profile.service.js";

/**
 * GET /api/customer/profile
 * Returns the authenticated customer's Firestore document.
 */
export const getProfile = asyncHandler(async (req, res) => {
  const profile = await getCustomerProfile(req.user.uid);
  res.status(200).json(new ApiResponse(200, profile, "Profile fetched successfully"));
});

/**
 * PATCH /api/customer/profile
 * Updates safe fields on the authenticated customer's document.
 * Blocked fields (uid, email, role, createdAt) are silently ignored by the service.
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const updated = await updateCustomerProfile(req.user.uid, req.body);
  res.status(200).json(new ApiResponse(200, updated, "Profile updated successfully"));
});

/**
 * PATCH /api/customer/profile/image
 * Uploads a profile photo to Cloudinary (sahakari/customer, resource_type: "image")
 * and saves the secure_url to customers/{uid}.photoUrl.
 */
export const uploadProfileImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "No image file provided");
  }
  const updated = await updateCustomerProfileImageService(req.user.uid, req.file.buffer);
  res.status(200).json(new ApiResponse(200, updated, "Profile image uploaded successfully"));
});
