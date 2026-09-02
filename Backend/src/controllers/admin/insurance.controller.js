import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import {
  getAdminInsuranceClaimsService,
  getAdminInsuranceClaimByIdService,
  updateAdminInsuranceClaimStatusService,
} from "../../services/admin/insurance.service.js";

/**
 * GET /api/admin/insurance-claims
 * Search & filter worker insurance claims.
 */
export const getAdminInsuranceClaims = asyncHandler(async (req, res) => {
  const result = await getAdminInsuranceClaimsService(req.user, req.query);
  res
    .status(200)
    .json(new ApiResponse(200, result, "Insurance claims list fetched successfully"));
});

/**
 * GET /api/admin/insurance-claims/:id
 * View claim detail with embedded worker profile and signed Cloudinary evidence URLs.
 */
export const getAdminInsuranceClaimById = asyncHandler(async (req, res) => {
  const claimDetail = await getAdminInsuranceClaimByIdService(req.user, req.params.id);
  res
    .status(200)
    .json(new ApiResponse(200, claimDetail, "Insurance claim detail fetched successfully"));
});

/**
 * PATCH /api/admin/insurance-claims/:id/status
 * Approve or reject a worker insurance claim.
 */
export const updateAdminInsuranceClaimStatus = asyncHandler(async (req, res) => {
  const updated = await updateAdminInsuranceClaimStatusService(
    req.user,
    req.params.id,
    req.body
  );
  res
    .status(200)
    .json(new ApiResponse(200, updated, `Insurance claim status updated to '${updated.status}'`));
});
