import { db } from "../../config/firebase.js";
import ApiError from "../../utils/ApiError.js";

const ALLOWED_AVAILABILITY_STATUSES = ["ONLINE", "OFFLINE", "ON_BREAK"];

/**
 * Helper to fetch worker document snapshot by user ID.
 * @param {string} uid
 * @returns {Promise<FirebaseFirestore.QueryDocumentSnapshot>}
 */
const getWorkerDocByUserId = async (uid) => {
  const querySnap = await db.collection("workers").where("userId", "==", uid).limit(1).get();
  if (querySnap.empty) {
    throw new ApiError(404, "Worker profile not found");
  }
  return querySnap.docs[0];
};

/**
 * Update worker availability status using dot-notation.
 * Tracks CLOCK_IN, CLOCK_OUT, BREAK_START, BREAK_END in workerShiftLogs.
 *
 * @param {string} uid - Firebase Auth user ID
 * @param {Object} body - { status: "ONLINE" | "OFFLINE" | "ON_BREAK" }
 * @returns {Promise<Object>} Updated worker profile
 */
export const updateWorkerAvailabilityService = async (uid, body) => {
  const { status } = body;

  if (!status || !ALLOWED_AVAILABILITY_STATUSES.includes(status)) {
    throw new ApiError(
      400,
      `Invalid or missing status. Allowed values: ${ALLOWED_AVAILABILITY_STATUSES.join(", ")}`
    );
  }

  const doc = await getWorkerDocByUserId(uid);
  const workerData = doc.data();
  const currentStatus = workerData.availability?.status || "OFFLINE";

  // Prevent redundant status updates
  if (status === currentStatus) {
    return { workerId: doc.id, id: doc.id, ...workerData };
  }

  const workerId = doc.id;
  const now = new Date();
  const nowIso = now.toISOString();
  
  // Check active bookings
  const activeBookingsSnap = await db.collection("bookings")
    .where("workerId", "==", workerId)
    .where("status", "in", ["WORKER_ACCEPTED", "ON_THE_WAY", "ARRIVED", "IN_PROGRESS"])
    .limit(1)
    .get();
  
  const hasActiveBooking = !activeBookingsSnap.empty;

  // 1. Guard: Voluntary OFFLINE or ON_BREAK mid-booking is forbidden
  if ((status === "OFFLINE" || status === "ON_BREAK") && hasActiveBooking) {
    throw new ApiError(400, "Cannot go OFFLINE or ON_BREAK while you have an active booking");
  }

  // Time boundary for 24 hours ago
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  // Shift calculation helpers
  if (status === "ONLINE") {
    // 2. Guard: 8-hour cap (only block if going ONLINE and NO active booking)
    // The active booking check overrides the 8h block (so if a bug/system forced them offline, they can reconnect)
    if (!hasActiveBooking) {
      const logsSnap = await db.collection("workerShiftLogs")
        .where("workerId", "==", workerId)
        .get();

      let totalDurationMs = 0;
      let lastClockIn = null;

      // Sort and filter in memory to avoid Firestore composite index requirement
      const logs = [];
      logsSnap.forEach((doc) => {
        const data = doc.data();
        if (new Date(data.timestamp).toISOString() >= twentyFourHoursAgo) {
          logs.push(data);
        }
      });
      logs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      logs.forEach((log) => {
        if (log.type === "CLOCK_IN") {
          lastClockIn = new Date(log.timestamp).getTime();
        } else if (log.type === "CLOCK_OUT" && lastClockIn !== null) {
          totalDurationMs += new Date(log.timestamp).getTime() - lastClockIn;
          lastClockIn = null;
        }
      });
      
      // If currently clocked in, add ongoing time
      if (lastClockIn !== null) {
         totalDurationMs += now.getTime() - lastClockIn;
      }

      if (totalDurationMs >= 8 * 60 * 60 * 1000) {
        throw new ApiError(400, "You have reached the 8-hour shift limit for the past 24 hours");
      }
    }
  } else if (status === "ON_BREAK") {
    // 3. Guard: 3-break limit
    const breaksSnap = await db.collection("workerShiftLogs")
      .where("workerId", "==", workerId)
      .where("type", "==", "BREAK_START")
      .get();
    
    let breakCount = 0;
    breaksSnap.forEach((doc) => {
      if (new Date(doc.data().timestamp).toISOString() >= twentyFourHoursAgo) {
        breakCount++;
      }
    });

    if (breakCount >= 3) {
      throw new ApiError(400, "You have reached the limit of 3 breaks in the past 24 hours");
    }
  }

  // Determine what shift event this maps to
  let eventType = null;
  if (status === "ONLINE") {
    eventType = currentStatus === "ON_BREAK" ? "BREAK_END" : "CLOCK_IN";
  } else if (status === "ON_BREAK") {
    eventType = "BREAK_START";
  } else if (status === "OFFLINE") {
    eventType = "CLOCK_OUT";
  }

  // Perform updates
  const batch = db.batch();
  
  // Update Worker Doc
  batch.update(doc.ref, {
    "availability.status": status,
    "availability.updatedAt": nowIso,
    updatedAt: nowIso,
  });

  // Add Log Entry
  if (eventType) {
      const logRef = db.collection("workerShiftLogs").doc();
      // Store shift log timestamps as UTC ISO strings (consistent with incident reconstruction)
      batch.set(logRef, {
        workerId,
        type: eventType,
        timestamp: nowIso
      });
  }

  await batch.commit();

  const updatedSnap = await doc.ref.get();
  return { workerId: updatedSnap.id, id: updatedSnap.id, ...updatedSnap.data() };
};

/**
 * Update worker geographic location using dot-notation.
 * @param {string} uid - Firebase Auth user ID
 * @param {Object} body - { lat: number, lng: number }
 * @returns {Promise<Object>} Updated worker profile
 */
export const updateWorkerLocationService = async (uid, body) => {
  const { lat, lng } = body;

  if (lat === undefined || lng === undefined) {
    throw new ApiError(400, "Both 'lat' and 'lng' are required");
  }

  const numLat = Number(lat);
  const numLng = Number(lng);

  if (isNaN(numLat) || isNaN(numLng)) {
    throw new ApiError(400, "'lat' and 'lng' must be valid numbers");
  }

  if (numLat < -90 || numLat > 90) {
    throw new ApiError(400, "'lat' must be between -90 and 90 degrees");
  }

  if (numLng < -180 || numLng > 180) {
    throw new ApiError(400, "'lng' must be between -180 and 180 degrees");
  }

  const doc = await getWorkerDocByUserId(uid);
  const docRef = doc.ref;
  const now = new Date().toISOString();

  // Use Firestore dot-notation to update location: { lat, lng } object matching haversineDistance
  await docRef.update({
    "location.lat": numLat,
    "location.lng": numLng,
    "location.updatedAt": now,
    updatedAt: now,
  });

  const updatedSnap = await docRef.get();
  return { workerId: updatedSnap.id, id: updatedSnap.id, ...updatedSnap.data() };
};
