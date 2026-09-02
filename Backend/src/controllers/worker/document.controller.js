import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import {
  uploadWorkerDocumentService,
  getWorkerDocumentsService,
  getWorkerDocumentByIdService,
} from "../../services/worker/document.service.js";

/**
 * POST /api/worker/documents
 * Uploads a worker KYC document to Firebase Storage and records it in Firestore.
 */
export const uploadDocument = asyncHandler(async (req, res) => {
  const result = await uploadWorkerDocumentService(req.user.uid, req.file, req.body);
  res
    .status(201)
    .json(new ApiResponse(201, result, "Worker document uploaded successfully"));
});

/**
 * GET /api/worker/documents
 * Lists all KYC documents uploaded by the authenticated worker.
 */
export const getDocuments = asyncHandler(async (req, res) => {
  const list = await getWorkerDocumentsService(req.user.uid);
  res
    .status(200)
    .json(new ApiResponse(200, list, "Worker documents retrieved successfully"));
});

/**
 * GET /api/worker/documents/:id
 * Fetches a single worker document by ID, including a fresh 15-minute signed view URL.
 */
export const getDocumentById = asyncHandler(async (req, res) => {
  const docInfo = await getWorkerDocumentByIdService(req.user.uid, req.params.id);
  res
    .status(200)
    .json(new ApiResponse(200, docInfo, "Worker document fetched successfully"));
});
