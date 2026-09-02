import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import {
  getAdminCooperativesService,
  createAdminCooperativeService,
  getAdminCooperativeByIdService,
} from "../../services/admin/cooperative.service.js";

/**
 * GET /api/admin/cooperatives
 * List cooperatives (SUPER_ADMIN gets all; COOPERATIVE_ADMIN gets assigned cooperative only).
 */
export const getAdminCooperatives = asyncHandler(async (req, res) => {
  const result = await getAdminCooperativesService(req.user);
  res
    .status(200)
    .json(new ApiResponse(200, result, "Cooperatives list fetched successfully"));
});

/**
 * POST /api/admin/cooperatives
 * Register a new cooperative entity (SUPER_ADMIN only).
 */
export const createAdminCooperative = asyncHandler(async (req, res) => {
  const coop = await createAdminCooperativeService(req.body);
  res
    .status(201)
    .json(new ApiResponse(201, coop, "Cooperative registered successfully"));
});

/**
 * GET /api/admin/cooperatives/:id
 * View cooperative details and member metrics.
 */
export const getAdminCooperativeById = asyncHandler(async (req, res) => {
  const coopDetail = await getAdminCooperativeByIdService(req.user, req.params.id);
  res
    .status(200)
    .json(new ApiResponse(200, coopDetail, "Cooperative details fetched successfully"));
});
