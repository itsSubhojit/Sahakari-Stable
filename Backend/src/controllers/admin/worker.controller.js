import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import {
  getPendingVerificationWorkersService,
  getWorkerDocumentsAdminService,
  verifyWorkerService,
} from "../../services/admin/worker.service.js";

/**
 * GET /api/admin/workers/pending-verification
 * Fetches all workers with verificationStatus == "pending". Scoped for COOPERATIVE_ADMIN.
 */
export const getPendingVerificationWorkers = asyncHandler(async (req, res) => {
  const workers = await getPendingVerificationWorkersService(req.user);
  res
    .status(200)
    .json(new ApiResponse(200, { workers, count: workers.length }, "Pending verification workers fetched successfully"));
});

/**
 * GET /api/admin/workers/:id/documents
 * Fetches KYC document records for a worker, attaching fresh 15-min signed Cloudinary view URLs. Scoped for COOPERATIVE_ADMIN.
 */
export const getWorkerDocumentsAdmin = asyncHandler(async (req, res) => {
  const result = await getWorkerDocumentsAdminService(req.user, req.params.id);
  res.status(200).json(new ApiResponse(200, result, "Worker documents fetched successfully"));
});

/**
 * PATCH /api/admin/workers/:id/verify
 * Approves or rejects worker verification status. Body: { status: "verified" | "rejected", reason?: string }
 */
export const verifyWorker = asyncHandler(async (req, res) => {
  const updated = await verifyWorkerService(req.user, req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, updated, `Worker status updated to '${updated.verificationStatus}'`));
});
