import { db } from "../../config/firebase.js";
import ApiError from "../../utils/ApiError.js";

/**
 * POST /api/bookings/:id/reviews
 * Worker submits a review for a completed booking.
 *
 * Rules:
 * 1. Booking must exist and its status must be "COMPLETED".
 * 2. Only the assigned worker (booking.workerId) can submit a worker->customer review.
 * 3. A worker can only review a booking once (prevent duplicates).
 *
 * Schema (aligned with spec):
 * - bookingId: string
 * - customerId: string
 * - workerId: string
 * - reviewerRole: "WORKER"
 * - rating: number (1-5)
 * - comment: string (optional)
 * - createdAt: ISO string
 *
 * Note: Customer aggregate ratings are NOT calculated/stored in MVP to avoid scope creep.
 *
 * @param {string} uid - Worker user ID
 * @param {string} bookingId - Firestore booking document ID
 * @param {Object} reviewData - { rating, comment }
 * @returns {Promise<Object>} Created review document
 */
export const createWorkerReviewService = async (uid, bookingId, { rating, comment }) => {
  // Validate rating
  if (!rating || typeof rating !== "number" || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
    throw new ApiError(400, "rating must be an integer between 1 and 5");
  }

  // Enforce comment length if provided
  if (comment && typeof comment !== "string") {
    throw new ApiError(400, "comment must be a string");
  }
  if (comment && comment.length > 500) {
    throw new ApiError(400, "comment cannot exceed 500 characters");
  }

  // 1. Resolve Worker ID
  const workerSnap = await db.collection("workers").where("userId", "==", uid).limit(1).get();
  if (workerSnap.empty) {
    throw new ApiError(404, "Worker profile not found");
  }
  const workerId = workerSnap.docs[0].id;

  // 2. Fetch booking
  const bookingRef = db.collection("bookings").doc(bookingId);
  const bookingSnap = await bookingRef.get();

  if (!bookingSnap.exists) {
    throw new ApiError(404, "Booking not found");
  }

  const booking = bookingSnap.data();

  // 3. Ownership and Status Guards
  if (booking.workerId !== workerId) {
    throw new ApiError(403, "Forbidden: You are not the assigned worker for this booking");
  }

  if (booking.status !== "COMPLETED") {
    throw new ApiError(400, `Cannot review booking. Status is '${booking.status}', must be 'COMPLETED'`);
  }

  // 4. Duplicate Guard
  const duplicateCheck = await db
    .collection("reviews")
    .where("bookingId", "==", bookingId)
    .where("reviewerRole", "==", "WORKER")
    .limit(1)
    .get();

  if (!duplicateCheck.empty) {
    throw new ApiError(409, "You have already submitted a review for this booking");
  }

  // 5. Create Review
  const reviewDoc = {
    bookingId,
    customerId: booking.customerId,
    workerId,
    reviewerRole: "WORKER",
    rating,
    comment: comment ? comment.trim() : "",
    createdAt: new Date().toISOString(),
  };

  const newReviewRef = await db.collection("reviews").add(reviewDoc);

  return { id: newReviewRef.id, ...reviewDoc };
};
