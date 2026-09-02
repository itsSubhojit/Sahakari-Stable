import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import {
  getAdminSosAlertsService,
  getAdminSosAlertByIdService,
  resolveAdminSosAlertService,
} from "../../services/admin/sos.service.js";

/**
 * GET /api/admin/sos/alerts
 * Search & filter emergency SOS safety alerts.
 */
export const getAdminSosAlerts = asyncHandler(async (req, res) => {
  const result = await getAdminSosAlertsService(req.user, req.query);
  res
    .status(200)
    .json(new ApiResponse(200, result, "Safety alerts list fetched successfully"));
});

/**
 * GET /api/admin/sos/alerts/:id
 * View emergency alert detail with linked worker, booking, and location.
 */
export const getAdminSosAlertById = asyncHandler(async (req, res) => {
  const alertDetail = await getAdminSosAlertByIdService(req.user, req.params.id);
  res
    .status(200)
    .json(new ApiResponse(200, alertDetail, "Safety alert detail fetched successfully"));
});

/**
 * PATCH /api/admin/sos/alerts/:id/resolve
 * Resolve an active emergency safety alert.
 */
export const resolveAdminSosAlert = asyncHandler(async (req, res) => {
  const updated = await resolveAdminSosAlertService(req.user, req.params.id, req.body);
  res
    .status(200)
    .json(new ApiResponse(200, updated, "Safety alert resolved successfully"));
});
