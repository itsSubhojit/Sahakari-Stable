import { db } from "../../config/firebase.js";
import { haversineDistance } from "../../utils/distance.js";
import ApiError from "../../utils/ApiError.js";

/**
 * Fetch and score nearby online workers within a radius.
 * If serviceId is provided, filters workers with matching skill.
 * Scoring formula: 0.35×skillMatch + 0.25×distanceScore + 0.20×rating + 0.10×availability + 0.10×(1−workload)
 *
 * @param {Object} query - { serviceId, lat, lng, radius }
 * @returns {Promise<Array<Object>>} List of eligible scored workers ordered by score descending
 */
export const getNearbyWorkersService = async (query) => {
  const { serviceId, lat: rawLat, lng: rawLng, radius: rawRadius } = query;

  const lat = parseFloat(rawLat);
  const lng = parseFloat(rawLng);
  const radius = parseFloat(rawRadius || 10); // default radius 10 km

  if (isNaN(lat) || isNaN(lng)) {
    throw new ApiError(400, "Valid lat and lng query parameters are required");
  }

  if (isNaN(radius) || radius <= 0) {
    throw new ApiError(400, "Radius must be a positive number");
  }

  const customerLoc = { lat, lng };

  // Query ONLINE workers (optionally filtering by service skill)
  let workerQuery = db.collection("workers").where("availability.status", "==", "ONLINE");
  if (serviceId) {
    workerQuery = workerQuery.where("skills", "array-contains", serviceId);
  }
  const snapshot = await workerQuery.get();

  const eligibleWorkers = [];

  snapshot.forEach((doc) => {
    const data = doc.data();
    if (!data.location || typeof data.location.lat !== "number" || typeof data.location.lng !== "number") {
      return; // Skip worker if location is invalid
    }

    const distance = haversineDistance(customerLoc, data.location);

    // Haversine radius filter: exclude workers further than radius km
    if (distance > radius) {
      return;
    }

    // Scoring components calculation
    const skillMatch = serviceId ? (Array.isArray(data.skills) && data.skills.includes(serviceId) ? 1.0 : 0.5) : 1.0;
    const distanceScore = Math.max(0, 1 - distance / radius);
    const ratingNorm = Math.min(1.0, Math.max(0, (data.rating || 0) / 5.0));
    const availabilityNorm = data.availability?.status === "ONLINE" ? 1.0 : 0.0;
    
    // Workload calculation: activeJobs normalized to [0, 1] assuming 5 active jobs is max workload
    const activeJobs = data.activeJobs !== undefined ? data.activeJobs : (data.workload !== undefined ? data.workload : 0);
    const workloadNorm = Math.min(1.0, Math.max(0, activeJobs / 5.0));

    const score =
      0.35 * skillMatch +
      0.25 * distanceScore +
      0.20 * ratingNorm +
      0.10 * availabilityNorm +
      0.10 * (1.0 - workloadNorm);

    eligibleWorkers.push({
      id: doc.id,
      ...data,
      distance: Number(distance.toFixed(2)),
      score: Number(score.toFixed(4)),
    });
  });

  // Sort by score descending (highest match score first)
  eligibleWorkers.sort((a, b) => b.score - a.score);

  return eligibleWorkers;
};
