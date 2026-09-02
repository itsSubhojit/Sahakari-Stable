import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import {
  getNearbyServiceRequestsService,
  openWorkerNegotiationService,
} from "../../services/worker/request.service.js";

/**
 * GET /api/worker/requests/nearby
 * Retrieves nearby open service requests matching worker's skills & location, ranked by the 5-factor scoring formula.
 */
export const getNearbyRequests = asyncHandler(async (req, res) => {
  const requests = await getNearbyServiceRequestsService(req.user.uid, req.query);
  res
    .status(200)
    .json(new ApiResponse(200, requests, "Nearby service requests fetched successfully"));
});

/**
 * POST /api/service-requests/:id/negotiations
 * Worker opens a new negotiation thread on an open service request.
 */
export const openNegotiation = asyncHandler(async (req, res) => {
  const negotiation = await openWorkerNegotiationService(
    req.user.uid,
    req.params.id,
    req.body
  );
  res
    .status(201)
    .json(new ApiResponse(201, negotiation, "Negotiation thread opened successfully"));
});
