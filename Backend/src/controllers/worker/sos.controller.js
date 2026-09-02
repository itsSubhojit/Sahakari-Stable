import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import { triggerSosAlertService } from "../../services/worker/sos.service.js";

/**
 * POST /api/worker/sos
 * Triggers an SOS/Safety alert.
 */
export const triggerSosAlert = asyncHandler(async (req, res) => {
  const alert = await triggerSosAlertService(req.user.uid, req.body);
  res.status(201).json(new ApiResponse(201, alert, "SOS Alert triggered successfully"));
});
