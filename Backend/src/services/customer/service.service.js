import { db } from "../../config/firebase.js";
import ApiError from "../../utils/ApiError.js";

/**
 * Get all available services.
 * @returns {Promise<Array<Object>>} List of services
 */
export const getAllServices = async () => {
  const snapshot = await db.collection("services").get();
  const services = [];

  snapshot.forEach((doc) => {
    services.push({ id: doc.id, ...doc.data() });
  });

  return services;
};

/**
 * Get a single service by ID.
 * @param {string} serviceId
 * @returns {Promise<Object>} Service document data
 */
export const getServiceById = async (serviceId) => {
  if (!serviceId) {
    throw new ApiError(400, "Service ID is required");
  }

  const docRef = db.collection("services").doc(serviceId);
  const snap = await docRef.get();

  if (!snap.exists) {
    throw new ApiError(404, "Service not found");
  }

  return { id: snap.id, ...snap.data() };
};
