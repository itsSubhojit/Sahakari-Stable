import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import { getAllServices, getServiceById } from "../../services/customer/service.service.js";

/**
 * GET /api/services
 * Retrieves a list of all services.
 */
export const getServices = asyncHandler(async (req, res) => {
  const services = await getAllServices();
  res.status(200).json(new ApiResponse(200, services, "Services retrieved successfully"));
});

/**
 * GET /api/services/:serviceId
 * Retrieves details for a specific service by ID.
 */
export const getServiceDetails = asyncHandler(async (req, res) => {
  const service = await getServiceById(req.params.serviceId);
  res.status(200).json(new ApiResponse(200, service, "Service details retrieved successfully"));
});
