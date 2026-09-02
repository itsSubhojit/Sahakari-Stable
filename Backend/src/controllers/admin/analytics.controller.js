import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import {
  getFederationOverviewService,
  getFinancialAnalyticsOverviewService,
} from "../../services/admin/analytics.service.js";

/**
 * GET /api/admin/federation/overview
 * Executive dashboard KPIs for the platform / cooperative federation.
 */
export const getFederationOverview = asyncHandler(async (req, res) => {
  const overview = await getFederationOverviewService(req.user);
  res
    .status(200)
    .json(new ApiResponse(200, overview, "Federation administration dashboard overview fetched successfully"));
});

/**
 * GET /api/admin/analytics/overview
 * Financial & transaction analytics overview.
 */
export const getFinancialAnalyticsOverview = asyncHandler(async (req, res) => {
  const analytics = await getFinancialAnalyticsOverviewService(req.user);
  res
    .status(200)
    .json(new ApiResponse(200, analytics, "Financial and transaction analytics overview fetched successfully"));
});
