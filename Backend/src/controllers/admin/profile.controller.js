import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import { getAdminProfileService } from "../../services/admin/profile.service.js";

/**
 * GET /api/admin/profile
 * Returns the authenticated Admin's Firestore document from admins/{uid}.
 */
export const getAdminProfile = asyncHandler(async (req, res) => {
  const profile = await getAdminProfileService(req.user.uid);
  res.status(200).json(new ApiResponse(200, profile, "Admin profile fetched successfully"));
});
