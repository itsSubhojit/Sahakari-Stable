import { db } from "../../config/firebase.js";
import ApiError from "../../utils/ApiError.js";
import { haversineDistance } from "../../utils/distance.js";

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
 * Fetch nearby open service requests matching worker's location and skills, ranked by the 5-factor scoring formula.
 * @param {string} uid - Worker user ID
 * @param {Object} queryParams - { radius }
 * @returns {Promise<Array<Object>>} Ranked list of nearby open service requests
 */
export const getNearbyServiceRequestsService = async (uid, queryParams = {}) => {
  const workerDoc = await getWorkerDocByUserId(uid);
  const worker = workerDoc.data();
  const workerId = workerDoc.id;

  if (!worker.location || typeof worker.location.lat !== "number" || typeof worker.location.lng !== "number") {
    throw new ApiError(400, "Worker location is not set. Please update your location before searching nearby requests.");
  }

  const workerLoc = { lat: worker.location.lat, lng: worker.location.lng };
  const searchRadius = Number(queryParams.radius) || Number(worker.serviceRadius) || 10; // default 10 km

  // Fetch OPEN service requests
  const requestsSnap = await db.collection("serviceRequests").where("status", "==", "OPEN").get();

  const workerSkills = Array.isArray(worker.skills) ? worker.skills.map((s) => s.toLowerCase()) : [];

  // Default neutral rating for new workers without reviews
  const rawRating = typeof worker.rating === "number" && worker.rating > 0 ? worker.rating : 4.0;
  const ratingScore = Math.min(1.0, Math.max(0, rawRating / 5.0));

  const isOnline = worker.availability?.status === "ONLINE";
  const availabilityScore = isOnline ? 1.0 : 0.0;

  const activeBookingsCount = typeof worker.activeBookingsCount === "number" ? worker.activeBookingsCount : 0;
  const workloadScore = Math.max(0, 1.0 - activeBookingsCount / 5.0);

  const rankedRequests = [];

  requestsSnap.forEach((doc) => {
    const reqData = doc.data();

    // Skip requests without valid location
    if (!reqData.location || typeof reqData.location.lat !== "number" || typeof reqData.location.lng !== "number") {
      return;
    }

    const distKm = haversineDistance(workerLoc, reqData.location);

    // Only include requests within search radius
    if (distKm <= searchRadius) {
      const category = (reqData.category || reqData.serviceCategory || "").toLowerCase();
      const requiredSkill = (reqData.requiredSkill || "").toLowerCase();

      let skillMatch = 0.5; // Neutral base score
      if (
        (category && workerSkills.includes(category)) ||
        (requiredSkill && workerSkills.includes(requiredSkill))
      ) {
        skillMatch = 1.0;
      }

      const distanceScore = Math.max(0, 1.0 - distKm / searchRadius);

      // Weighted scoring formula:
      // 0.35 * skillMatch + 0.25 * distanceScore + 0.20 * ratingScore + 0.10 * availabilityScore + 0.10 * workloadScore
      const matchScore =
        0.35 * skillMatch +
        0.25 * distanceScore +
        0.20 * ratingScore +
        0.10 * availabilityScore +
        0.10 * workloadScore;

      rankedRequests.push({
        id: doc.id,
        requestId: doc.id,
        ...reqData,
        distanceKm: Number(distKm.toFixed(2)),
        matchScore: Number(matchScore.toFixed(4)),
      });
    }
  });

  // Sort descending by matchScore
  rankedRequests.sort((a, b) => b.matchScore - a.matchScore);

  return rankedRequests;
};

/**
 * Worker opens a new negotiation thread on an OPEN service request.
 * @param {string} uid - Worker user ID
 * @param {string} requestId - Service request document ID
 * @param {Object} body - { amount, note }
 * @returns {Promise<Object>} Created negotiation document
 */
export const openWorkerNegotiationService = async (uid, requestId, body) => {
  const { amount, note } = body;

  if (amount === undefined || isNaN(Number(amount)) || Number(amount) <= 0) {
    throw new ApiError(400, "A valid positive numeric amount is required for negotiation proposal");
  }

  const reqRef = db.collection("serviceRequests").doc(requestId);
  const reqSnap = await reqRef.get();

  if (!reqSnap.exists) {
    throw new ApiError(404, "Service request not found");
  }

  const reqData = reqSnap.data();

  if (reqData.status !== "OPEN") {
    throw new ApiError(400, `Cannot open negotiation: service request status is '${reqData.status}'`);
  }

  const workerDoc = await getWorkerDocByUserId(uid);
  const workerId = workerDoc.id;

  // Check if worker already has a pending negotiation on this service request
  const existingNegSnap = await db
    .collection("negotiations")
    .where("requestId", "==", requestId)
    .where("workerId", "==", workerId)
    .where("status", "==", "PENDING")
    .get();

  if (!existingNegSnap.empty) {
    throw new ApiError(409, "You already have an active pending negotiation thread on this service request");
  }

  const now = new Date().toISOString();

  const negotiationData = {
    requestId,
    workerId,
    customerId: reqData.customerId,
    priceHistory: [
      {
        proposedBy: "GIG_WORKER",
        amount: Number(amount),
        note: note || "",
        timestamp: now,
      },
    ],
    turnOf: "CUSTOMER", // Worker opened the proposal; turn shifts to CUSTOMER
    status: "PENDING",
    createdAt: now,
    updatedAt: now,
  };

  const negRef = db.collection("negotiations").doc();
  await negRef.set(negotiationData);

  return {
    id: negRef.id,
    negotiationId: negRef.id,
    ...negotiationData,
  };
};
