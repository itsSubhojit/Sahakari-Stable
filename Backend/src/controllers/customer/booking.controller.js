import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import {
  getCustomerBookingsService,
  getCustomerActiveBookingsService,
  getBookingByIdService,
  cancelBookingService,
} from "../../services/customer/booking.service.js";

/**
 * GET /api/customer/bookings
 * Retrieves all bookings for the authenticated customer.
 */
export const getCustomerBookings = asyncHandler(async (req, res) => {
  const bookings = await getCustomerBookingsService(req.user.uid);
  res.status(200).json(new ApiResponse(200, bookings, "Customer bookings retrieved successfully"));
});

/**
 * GET /api/customer/bookings/active
 * Retrieves active bookings for the authenticated customer.
 */
export const getCustomerActiveBookings = asyncHandler(async (req, res) => {
  const bookings = await getCustomerActiveBookingsService(req.user.uid);
  res.status(200).json(new ApiResponse(200, bookings, "Active customer bookings retrieved successfully"));
});

/**
 * GET /api/bookings/:id
 * Retrieves details for a specific booking.
 */
export const getBookingById = asyncHandler(async (req, res) => {
  const booking = await getBookingByIdService(req.user, req.params.id);
  res.status(200).json(new ApiResponse(200, booking, "Booking details retrieved successfully"));
});

/**
 * POST /api/bookings/:id/cancel
 * Cancels a booking and updates associated service request status.
 */
export const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await cancelBookingService(req.user, req.params.id, req.body.reason);
  res.status(200).json(new ApiResponse(200, booking, "Booking cancelled successfully"));
});
