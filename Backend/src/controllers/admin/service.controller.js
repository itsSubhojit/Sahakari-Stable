import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import {
  getAdminServicesService,
  createAdminServiceService,
  updateAdminServiceService,
} from "../../services/admin/service.service.js";

/**
 * GET /api/admin/services
 * Returns the entire master service catalog. Allowed for COOPERATIVE_ADMIN & SUPER_ADMIN.
 */
export const getAdminServices = asyncHandler(async (req, res) => {
  const services = await getAdminServicesService();
  res
    .status(200)
    .json(new ApiResponse(200, { services, count: services.length }, "Master service catalog fetched successfully"));
});

/**
 * POST /api/admin/services
 * Creates a new master service. SUPER_ADMIN only.
 */
export const createAdminService = asyncHandler(async (req, res) => {
  const service = await createAdminServiceService(req.body);
  res
    .status(201)
    .json(new ApiResponse(201, service, "Master service created successfully"));
});

/**
 * PATCH /api/admin/services/:id
 * Partial update of an existing service. SUPER_ADMIN only.
 */
export const updateAdminService = asyncHandler(async (req, res) => {
  const updated = await updateAdminServiceService(req.params.id, req.body);
  res
    .status(200)
    .json(new ApiResponse(200, updated, "Master service updated successfully"));
});
