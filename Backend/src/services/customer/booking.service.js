import { db } from "../../config/firebase.js";
import ApiError from "../../utils/ApiError.js";
import { createNotification } from "../../utils/createNotification.js";

/**
 * Get all bookings for a customer.
 * @param {string} customerId
 * @returns {Promise<Array<Object>>} List of bookings sorted by createdAt desc
 */
export const getCustomerBookingsService = async (customerId) => {
  const snapshot = await db
    .collection("bookings")
    .where("customerId", "==", customerId)
    .get();

  const bookings = [];
  snapshot.forEach((doc) => {
    bookings.push({ id: doc.id, ...doc.data() });
  });

  // Sort in memory by createdAt descending
  bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return bookings;
};

/**
 * Get active bookings for a customer (status in PENDING_PAYMENT, CONFIRMED, IN_PROGRESS).
 * @param {string} customerId
 * @returns {Promise<Array<Object>>} Active bookings sorted by createdAt desc
 */
export const getCustomerActiveBookingsService = async (customerId) => {
  const allBookings = await getCustomerBookingsService(customerId);
  const activeStatuses = ["PENDING_PAYMENT", "CONFIRMED", "IN_PROGRESS"];

  return allBookings.filter((b) => activeStatuses.includes(b.status));
};

/**
 * Get details for a specific booking by ID.
 * Allowed for customer or worker participant.
 *
 * @param {Object} user - { uid, role }
 * @param {string} bookingId
 * @returns {Promise<Object>} Booking document
 */
export const getBookingByIdService = async (user, bookingId) => {
  if (!bookingId) {
    throw new ApiError(400, "Booking ID is required");
  }

  const snap = await db.collection("bookings").doc(bookingId).get();

  if (!snap.exists) {
    throw new ApiError(404, "Booking not found");
  }

  const booking = snap.data();

  // Participant authorization check
  let isParticipant = booking.customerId === user.uid || booking.workerId === user.uid;

  if (!isParticipant && user.role === "GIG_WORKER") {
    // Check if workerId matches caller's worker document ID
    const workerQuery = await db.collection("workers").where("userId", "==", user.uid).limit(1).get();
    if (!workerQuery.empty && workerQuery.docs[0].id === booking.workerId) {
      isParticipant = true;
    }
  }

  if (!isParticipant) {
    throw new ApiError(403, "Forbidden: You are not a participant of this booking");
  }

  return { id: snap.id, ...booking };
};

/**
 * Cancel a booking.
 * Allowed for customer or worker participant.
 * Cannot cancel if booking is already COMPLETED or CANCELLED.
 *
 * @param {Object} user - { uid, role }
 * @param {string} bookingId
 * @param {string} [reason] - Optional cancellation reason
 * @returns {Promise<Object>} Updated booking document
 */
export const cancelBookingService = async (user, bookingId, reason) => {
  const booking = await getBookingByIdService(user, bookingId);

  if (["IN_PROGRESS", "COMPLETED", "CANCELLED"].includes(booking.status)) {
    throw new ApiError(400, `Cannot cancel booking: it is already ${booking.status.toLowerCase()}`);
  }

  const now = new Date().toISOString();
  const updates = {
    status: "CANCELLED",
    cancellationReason: reason || `Cancelled by ${user.role.toLowerCase()}`,
    cancelledBy: user.uid,
    updatedAt: now,
  };

  const bookingRef = db.collection("bookings").doc(bookingId);
  await bookingRef.update(updates);

  // If associated service request exists, update its status to CANCELLED
  if (booking.requestId) {
    const reqRef = db.collection("serviceRequests").doc(booking.requestId);
    const reqSnap = await reqRef.get();
    if (reqSnap.exists) {
      await reqRef.update({
        status: "CANCELLED",
        updatedAt: now,
      });
    }
  }

  const updatedSnap = await bookingRef.get();
  const result = { id: updatedSnap.id, ...updatedSnap.data() };

  // Notify the OTHER participant about the cancellation (fire-and-forget)
  const cancellerIsCustomer = user.role === "CUSTOMER";
  const otherUid = cancellerIsCustomer ? booking.workerId : booking.customerId;
  createNotification(
    otherUid,
    "BOOKING_CANCELLED",
    "Booking cancelled",
    `Booking ${bookingId} was cancelled by the ${cancellerIsCustomer ? "customer" : "worker"}.`,
    { bookingId, cancelledBy: user.uid, reason: reason || null }
  ).catch(() => {}); // never block the response

  return result;
};
