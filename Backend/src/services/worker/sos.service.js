import { db } from "../../config/firebase.js";
import ApiError from "../../utils/ApiError.js";

/**
 * Triggers an SOS/Safety alert for a worker.
 *
 * @param {string} uid - Worker user ID
 * @param {Object} payload - Optional { location: { lat, lng } }
 * @returns {Promise<Object>} Created safetyAlert document
 */
export const triggerSosAlertService = async (uid, payload = {}) => {
  // 1. Resolve Worker ID and fetch worker profile
  const workerSnap = await db.collection("workers").where("userId", "==", uid).limit(1).get();
  if (workerSnap.empty) {
    throw new ApiError(404, "Worker profile not found");
  }
  const workerDoc = workerSnap.docs[0];
  const workerId = workerDoc.id;
  const workerData = workerDoc.data();

  // 2. Location Logic (Payload -> Worker Profile -> null)
  let location = null;
  if (payload.location && typeof payload.location.lat === "number" && typeof payload.location.lng === "number") {
    location = {
      lat: payload.location.lat,
      lng: payload.location.lng,
    };
  } else if (workerData.location && typeof workerData.location.lat === "number" && typeof workerData.location.lng === "number") {
    location = {
      lat: workerData.location.lat,
      lng: workerData.location.lng,
    };
  }

  // 3. Find Active Booking
  let bookingId = null;
  const activeBookingsSnap = await db.collection("bookings")
    .where("workerId", "==", workerId)
    .where("status", "in", ["WORKER_ACCEPTED", "ON_THE_WAY", "ARRIVED", "IN_PROGRESS"])
    .limit(1)
    .get();

  if (!activeBookingsSnap.empty) {
    bookingId = activeBookingsSnap.docs[0].id;
  }

  // 4. Create Safety Alert Document
  const alertDoc = {
    workerId,
    bookingId,
    location,
    status: "OPEN",
    timestamp: new Date().toISOString(),
  };

  const newAlertRef = await db.collection("safetyAlerts").add(alertDoc);

  return { id: newAlertRef.id, ...alertDoc };
};
