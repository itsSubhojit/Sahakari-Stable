import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import {
  getAdminBookingsService,
  getAdminBookingByIdService,
} from "../../services/admin/booking.service.js";

/**
 * GET /api/admin/bookings
 * Search & filter platform or cooperative bookings.
 * Query params: ?status=CONFIRMED&limit=20
 */
export const getAdminBookings = asyncHandler(async (req, res) => {
  const result = await getAdminBookingsService(req.user, req.query);
  res
    .status(200)
    .json(new ApiResponse(200, result, "Admin bookings list fetched successfully"));
});

/**
 * GET /api/admin/bookings/:id
 * Fetches comprehensive booking details including linked customer, worker, service, payment & negotiation.
 */
export const getAdminBookingById = asyncHandler(async (req, res) => {
  const bookingDetail = await getAdminBookingByIdService(req.user, req.params.id);
  res
    .status(200)
    .json(new ApiResponse(200, bookingDetail, "Admin booking detail fetched successfully"));
});
