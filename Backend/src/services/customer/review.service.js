import { db } from "../../config/firebase.js";
import ApiError from "../../utils/ApiError.js";

/**
 * Submit a customer review for a completed booking and update worker's aggregate rating.
 *
 * @param {Object} user - { uid, role }
 * @param {Object} data - { bookingId, rating, comment }
 * @returns {Promise<Object>} Created review document
 */
export const createCustomerReviewService = async (user, data) => {
  const { bookingId, rating: rawRating, comment } = data;

  if (!bookingId) {
    throw new ApiError(400, "bookingId is required");
  }

  const rating = Number(rawRating);
  if (isNaN(rating) || rating < 1 || rating > 5) {
    throw new ApiError(400, "Rating must be a number between 1 and 5");
  }

  // 1. Fetch booking details
  const bookingRef = db.collection("bookings").doc(bookingId);
  const snap = await bookingRef.get();

  if (!snap.exists) {
    throw new ApiError(404, "Booking not found");
  }

  const booking = snap.data();

  // 2. Ownership check
  if (booking.customerId !== user.uid) {
    throw new ApiError(403, "Forbidden: You do not own this booking");
  }

  // 3. Completion check
  if (booking.status !== "COMPLETED") {
    throw new ApiError(400, "Cannot review a booking that is not completed");
  }

  // 4. Duplicate review check
  const duplicateQuery = await db
    .collection("reviews")
    .where("bookingId", "==", bookingId)
    .where("reviewerId", "==", user.uid)
    .where("reviewerRole", "==", "CUSTOMER")
    .get();

  if (!duplicateQuery.empty) {
    throw new ApiError(409, "You have already reviewed this booking");
  }

  const now = new Date().toISOString();
  const reviewData = {
    bookingId,
    customerId: user.uid,
    reviewerId: user.uid,
    workerId: booking.workerId,
    reviewerRole: "CUSTOMER",
    targetRole: "GIG_WORKER",
    rating,
    comment: comment || "",
    createdAt: now,
  };

  const reviewRef = await db.collection("reviews").add(reviewData);

  // 5. Update worker aggregate rating
  await updateWorkerAggregateRating(booking.workerId);

  return { id: reviewRef.id, ...reviewData };
};

/**
 * Recalculate and update aggregate rating for a worker.
 * @param {string} workerId
 */
const updateWorkerAggregateRating = async (workerId) => {
  if (!workerId) return;

  const reviewsQuery = await db
    .collection("reviews")
    .where("workerId", "==", workerId)
    .where("reviewerRole", "==", "CUSTOMER")
    .get();

  let totalRating = 0;
  let count = 0;

  reviewsQuery.forEach((doc) => {
    const r = doc.data().rating;
    if (typeof r === "number") {
      totalRating += r;
      count++;
    }
  });

  const avgRating = count > 0 ? Number((totalRating / count).toFixed(2)) : 0;
  const now = new Date().toISOString();

  // Try updating worker doc directly by ID
  const workerDocRef = db.collection("workers").doc(workerId);
  const workerSnap = await workerDocRef.get();

  if (workerSnap.exists) {
    await workerDocRef.update({
      rating: avgRating,
      totalReviews: count,
      updatedAt: now,
    });
  } else {
    // If workerId is userId, lookup worker doc by userId
    const workerQuery = await db.collection("workers").where("userId", "==", workerId).limit(1).get();
    if (!workerQuery.empty) {
      await workerQuery.docs[0].ref.update({
        rating: avgRating,
        totalReviews: count,
        updatedAt: now,
      });
    }
  }
};
