import { db } from "../../config/firebase.js";
import ApiError from "../../utils/ApiError.js";

/**
 * Valid worker-side booking status transitions.
 *
 * Full lifecycle (with payment gate enforced):
 *   PENDING_PAYMENT  -- payment not yet confirmed (Customer C6, not yet built)
 *   CONFIRMED        -- payment confirmed by customer; worker can now act
 *   WORKER_ACCEPTED  -- worker explicitly accepts the confirmed booking
 *   ON_THE_WAY       -- worker en route to customer location
 *   ARRIVED          -- worker has arrived at location
 *   IN_PROGRESS      -- work has started
 *   COMPLETED        -- work finished
 *
 * Workers may ONLY move bookings from CONFIRMED onward.
 * Any attempt to set a worker-side status on a PENDING_PAYMENT booking is rejected.
 */
const WORKER_TRANSITIONS = {
  CONFIRMED: "WORKER_ACCEPTED",
  WORKER_ACCEPTED: "ON_THE_WAY",
  ON_THE_WAY: "ARRIVED",
  ARRIVED: "IN_PROGRESS",
  IN_PROGRESS: "COMPLETED",
};

// All valid worker-side target statuses (excluding CONFIRMED itself — that comes from payment)
const WORKER_SETTABLE_STATUSES = new Set(Object.values(WORKER_TRANSITIONS));

/**
 * Helper: resolve worker document ID from user UID.
 * @param {string} uid
 * @returns {Promise<string>} workerId (Firestore doc ID)
 */
const getWorkerIdByUserId = async (uid) => {
  const querySnap = await db.collection("workers").where("userId", "==", uid).limit(1).get();
  if (querySnap.empty) {
    throw new ApiError(404, "Worker profile not found");
  }
  return querySnap.docs[0].id;
};

/**
 * PATCH /api/bookings/:id/status
 * Worker advances their own booking through the lifecycle state machine.
 *
 * Rules enforced:
 *  1. Booking must exist.
 *  2. Only the assigned worker (by workerId field) may update status — ownership check, not just role.
 *  3. If booking.status is PENDING_PAYMENT, reject immediately — payment hasn't been confirmed yet.
 *  4. The requested newStatus must be the exact next step after the current status — no skipping.
 *
 * @param {string} uid - Worker user ID (from JWT)
 * @param {string} bookingId - Firestore booking document ID
 * @param {string} newStatus - Requested new status
 * @returns {Promise<Object>} Updated booking document
 */
export const updateBookingStatusService = async (uid, bookingId, newStatus) => {
  if (!newStatus || typeof newStatus !== "string") {
    throw new ApiError(400, "newStatus is required");
  }

  const uppercased = newStatus.trim().toUpperCase();

  // Guard: only worker-settable statuses are accepted at all
  if (!WORKER_SETTABLE_STATUSES.has(uppercased)) {
    throw new ApiError(
      400,
      `Invalid status '${newStatus}'. Worker-settable statuses are: ${[...WORKER_SETTABLE_STATUSES].join(", ")}`
    );
  }

  const bookingRef = db.collection("bookings").doc(bookingId);
  const bookingSnap = await bookingRef.get();

  if (!bookingSnap.exists) {
    throw new ApiError(404, "Booking not found");
  }

  const booking = bookingSnap.data();

  // Ownership check: verify the calling worker is the assigned worker on this booking
  const workerId = await getWorkerIdByUserId(uid);
  if (booking.workerId !== workerId) {
    throw new ApiError(403, "Forbidden: You are not the assigned worker for this booking");
  }

  const currentStatus = booking.status;

  // Gate: block any worker-side action if booking hasn't been paid for yet
  if (currentStatus === "PENDING_PAYMENT") {
    throw new ApiError(
      400,
      "Booking has not been paid for yet (status: PENDING_PAYMENT). Worker-side status updates are only allowed after payment is confirmed (status: CONFIRMED)."
    );
  }

  // State machine: confirm the requested status is exactly the next valid step
  const expectedNext = WORKER_TRANSITIONS[currentStatus];

  if (!expectedNext) {
    // Current status is not in the transition map — either already COMPLETED or in an unrecognised state
    throw new ApiError(
      400,
      `Booking status '${currentStatus}' has no further worker-side transitions. Booking may already be completed or cancelled.`
    );
  }

  if (uppercased !== expectedNext) {
    throw new ApiError(
      400,
      `Invalid status transition: '${currentStatus}' → '${uppercased}' is not allowed. Expected next status is '${expectedNext}'.`
    );
  }

  const now = new Date().toISOString();
  await bookingRef.update({
    status: uppercased,
    updatedAt: now,
    ...(uppercased === "COMPLETED" ? { completedAt: now } : {}),
  });

  const updatedSnap = await bookingRef.get();
  return { id: updatedSnap.id, ...updatedSnap.data() };
};
