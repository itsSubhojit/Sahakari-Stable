import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import {
  createServiceRequestService,
  getServiceRequestByIdService,
  getServiceRequestNegotiationsService,
} from "../../services/customer/serviceRequest.service.js";

/**
 * POST /api/service-requests
 * Creates a new service request after passing radius-gate check.
 */
export const createServiceRequest = asyncHandler(async (req, res) => {
  const serviceRequest = await createServiceRequestService(req.user.uid, req.body);
  res.status(201).json(new ApiResponse(201, serviceRequest, "Service request created successfully"));
});

/**
 * GET /api/service-requests/:id
 * Retrieves details for a specific service request owned by the customer.
 */
export const getServiceRequestById = asyncHandler(async (req, res) => {
  const serviceRequest = await getServiceRequestByIdService(req.user.uid, req.params.id);
  res.status(200).json(new ApiResponse(200, serviceRequest, "Service request retrieved successfully"));
});

/**
 * GET /api/service-requests/:id/negotiations
 * Retrieves all negotiation threads associated with a service request owned by the customer.
 */
export const getServiceRequestNegotiations = asyncHandler(async (req, res) => {
  const negotiations = await getServiceRequestNegotiationsService(req.user.uid, req.params.id);
  res.status(200).json(new ApiResponse(200, negotiations, "Negotiations retrieved successfully"));
});
