import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import {
  counterNegotiationService,
  acceptNegotiationService,
  rejectNegotiationService,
} from "../../services/customer/negotiation.service.js";

/**
 * POST /api/negotiations/:id/counter
 * Sends a counter offer on a pending negotiation thread.
 * Allowed for both CUSTOMER and GIG_WORKER when it is their turn.
 */
export const counterNegotiation = asyncHandler(async (req, res) => {
  const negotiation = await counterNegotiationService(req.user, req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, negotiation, "Counter offer sent successfully"));
});

/**
 * POST /api/negotiations/:id/accept
 * Accepts the proposed offer, creates booking, and auto-rejects other pending threads.
 * Allowed for both CUSTOMER and GIG_WORKER when it is their turn.
 */
export const acceptNegotiation = asyncHandler(async (req, res) => {
  const result = await acceptNegotiationService(req.user, req.params.id);
  res.status(200).json(new ApiResponse(200, result, "Negotiation accepted and booking created successfully"));
});

/**
 * POST /api/negotiations/:id/reject
 * Rejects an offer, closing only this negotiation thread.
 * Allowed for both CUSTOMER and GIG_WORKER when it is their turn.
 */
export const rejectNegotiation = asyncHandler(async (req, res) => {
  const negotiation = await rejectNegotiationService(req.user, req.params.id);
  res.status(200).json(new ApiResponse(200, negotiation, "Negotiation rejected successfully"));
});
