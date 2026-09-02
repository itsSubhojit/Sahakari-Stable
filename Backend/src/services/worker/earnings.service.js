import { db } from "../../config/firebase.js";
import ApiError from "../../utils/ApiError.js";

/**
 * GET /api/worker/earnings
 * Returns earnings summary for the calling worker, computed from their COMPLETED bookings only.
 *
 * Filters applied (both required — neither alone is sufficient):
 *   1. workerId == the calling worker's Firestore document ID (ownership, not just role)
 *   2. status  == "COMPLETED" (excludes PENDING_PAYMENT, CONFIRMED, WORKER_ACCEPTED,
 *                               ON_THE_WAY, ARRIVED, IN_PROGRESS, cancelled, etc.)
 *
 * Returns:
 *   - totalEarnings : sum of agreedPrice across all matching bookings
 *   - completedCount: number of COMPLETED bookings
 *   - bookings      : array of individual booking summaries (id, agreedPrice, completedAt, scheduledDate)
 *
 * @param {string} uid - Firebase Auth user ID
 * @returns {Promise<Object>}
 */
export const getWorkerEarningsService = async (uid) => {
  // Resolve worker Firestore document ID
  const workerSnap = await db.collection("workers").where("userId", "==", uid).limit(1).get();
  if (workerSnap.empty) {
    throw new ApiError(404, "Worker profile not found");
  }
  const workerId = workerSnap.docs[0].id;

  // Query: only this worker's COMPLETED bookings
  const bookingsSnap = await db
    .collection("bookings")
    .where("workerId", "==", workerId)
    .where("status", "==", "COMPLETED")
    .get();

  let totalEarnings = 0;
  const bookings = [];

  bookingsSnap.forEach((doc) => {
    const data = doc.data();
    const price = typeof data.agreedPrice === "number" ? data.agreedPrice : 0;
    totalEarnings += price;
    bookings.push({
      id: doc.id,
      agreedPrice: price,
      completedAt: data.completedAt || null,
      scheduledDate: data.scheduledDate || null,
      serviceId: data.serviceId || null,
    });
  });

  // Sort by completedAt descending (most recent first), nulls last
  bookings.sort((a, b) => {
    if (!a.completedAt) return 1;
    if (!b.completedAt) return -1;
    return b.completedAt.localeCompare(a.completedAt);
  });

  return {
    workerId,
    totalEarnings,
    completedCount: bookings.length,
    bookings,
  };
};
