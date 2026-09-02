import { db } from "../../config/firebase.js";
import ApiError from "../../utils/ApiError.js";
import { getNearbyWorkersService } from "./nearby.service.js";

/**
 * Create a new service request after verifying nearby worker availability via radius gate.
 * @param {string} customerId - The authenticated customer's UID
 * @param {Object} data - { serviceId, description, proposedFee, location, preferredDate, preferredTime, radius }
 * @returns {Promise<Object>} Created service request document with ID
 */
export const createServiceRequestService = async (customerId, data) => {
  const { serviceId, description, proposedFee, location, preferredDate, preferredTime, radius } = data;

  if (!serviceId || !description || proposedFee === undefined || !location || !preferredDate || !preferredTime) {
    throw new ApiError(400, "Missing required fields: serviceId, description, proposedFee, location, preferredDate, preferredTime");
  }

  if (typeof location !== "object" || typeof location.lat !== "number" || typeof location.lng !== "number") {
    throw new ApiError(400, "Location must be an object with valid numeric lat and lng properties");
  }

  // Radius gate check: query nearby eligible workers using Phase C3 logic
  const nearbyWorkers = await getNearbyWorkersService({
    serviceId,
    lat: location.lat,
    lng: location.lng,
    radius: radius || 10,
  });

  if (!nearbyWorkers || nearbyWorkers.length === 0) {
    throw new ApiError(404, "No workers available near you right now");
  }

  const now = new Date().toISOString();
  const requestData = {
    customerId,
    serviceId,
    description,
    proposedFee: Number(proposedFee),
    location,
    preferredDate,
    preferredTime,
    status: "OPEN",
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await db.collection("serviceRequests").add(requestData);
  return { id: docRef.id, ...requestData };
};

/**
 * Fetch a single service request by ID owned by the customer.
 * @param {string} customerId
 * @param {string} requestId
 * @returns {Promise<Object>} Service request document
 */
export const getServiceRequestByIdService = async (customerId, requestId) => {
  if (!requestId) {
    throw new ApiError(400, "Request ID is required");
  }

  const snap = await db.collection("serviceRequests").doc(requestId).get();

  if (!snap.exists || snap.data().customerId !== customerId) {
    throw new ApiError(404, "Service request not found");
  }

  return { id: snap.id, ...snap.data() };
};

/**
 * Fetch all negotiation threads for a specific service request owned by the customer.
 * @param {string} customerId
 * @param {string} requestId
 * @returns {Promise<Array<Object>>} List of negotiation threads
 */
export const getServiceRequestNegotiationsService = async (customerId, requestId) => {
  // First verify request exists and belongs to customer
  await getServiceRequestByIdService(customerId, requestId);

  const snapshot = await db
    .collection("negotiations")
    .where("requestId", "==", requestId)
    .where("customerId", "==", customerId)
    .get();

  const negotiations = [];
  snapshot.forEach((doc) => {
    negotiations.push({ id: doc.id, ...doc.data() });
  });

  return negotiations;
};
