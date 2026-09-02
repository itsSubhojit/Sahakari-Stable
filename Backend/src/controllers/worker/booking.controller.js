import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import { updateBookingStatusService } from "../../services/worker/booking.service.js";

/**
 * PATCH /api/bookings/:id/status
 * Worker advances their own booking through the lifecycle state machine.
 */
export const updateBookingStatus = asyncHandler(async (req, res) => {
  const booking = await updateBookingStatusService(
    req.user.uid,
    req.params.id,
    req.body.status
  );
  res
    .status(200)
    .json(new ApiResponse(200, booking, `Booking status updated to '${booking.status}' successfully`));
});
