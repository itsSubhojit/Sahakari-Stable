import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import { updateWorkerBankDetailsService } from "../../services/worker/bank.service.js";

/**
 * PATCH /api/worker/bank-details
 * Submits or updates bank details for the authenticated verified worker.
 */
export const updateWorkerBankDetails = asyncHandler(async (req, res) => {
  const result = await updateWorkerBankDetailsService(req.user.uid, req.body);
  res
    .status(200)
    .json(new ApiResponse(200, result, "Bank details updated successfully"));
});
