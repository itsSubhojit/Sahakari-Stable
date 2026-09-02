import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import {
  submitInsuranceClaim,
  listInsuranceClaims,
  getInsuranceClaim,
} from "../../services/worker/insurance.service.js";

/**
 * POST /api/worker/insurance-claims
 */
export const submitClaim = asyncHandler(async (req, res) => {
  const claim = await submitInsuranceClaim(req.user.uid, req.files, req.body);
  res.status(201).json(new ApiResponse(201, claim, "Insurance claim submitted successfully"));
});

/**
 * GET /api/worker/insurance-claims
 */
export const listClaims = asyncHandler(async (req, res) => {
  const claims = await listInsuranceClaims(req.user.uid);
  res.status(200).json(new ApiResponse(200, claims, "Insurance claims retrieved successfully"));
});

/**
 * GET /api/worker/insurance-claims/:id
 */
export const getClaim = asyncHandler(async (req, res) => {
  const claim = await getInsuranceClaim(req.user.uid, req.params.id);
  res.status(200).json(new ApiResponse(200, claim, "Insurance claim fetched successfully"));
});
