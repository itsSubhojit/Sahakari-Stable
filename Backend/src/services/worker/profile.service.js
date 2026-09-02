import { db } from "../../config/firebase.js";
import ApiError from "../../utils/ApiError.js";

// Fields a worker is allowed to update in general profile:
// Explicitly excludes system/status fields (verificationStatus, userId, email, createdAt, updatedAt),
// hourlyRate (removed per spec), and location (dedicated W3 endpoint: PATCH /api/worker/location).
const ALLOWED_UPDATE_FIELDS = [
  "name",
  "phone",
  "skills",
  "bio",
  "experience",
  "serviceRadius",
  "photoUrl",
  "address",
];

/**
 * Helper to fetch worker document snapshot by Firebase Auth user ID.
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
 * Fetch worker profile by Firebase Auth uid.
 * @param {string} uid
 * @returns {Promise<Object>} Worker profile object with workerId attached
 */
export const getWorkerProfile = async (uid) => {
  const doc = await getWorkerDocByUserId(uid);
  return { workerId: doc.id, id: doc.id, ...doc.data() };
};

/**
 * Update worker profile for allowed fields.
 * @param {string} uid
 * @param {Object} body
 * @returns {Promise<Object>} Updated worker profile object
 */
export const updateWorkerProfile = async (uid, body) => {
  const doc = await getWorkerDocByUserId(uid);
  const docRef = doc.ref;

  const updates = {};
  for (const field of ALLOWED_UPDATE_FIELDS) {
    if (body[field] !== undefined) {
      updates[field] = body[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    throw new ApiError(
      400,
      `No valid fields to update. Allowed fields: ${ALLOWED_UPDATE_FIELDS.join(", ")}`
    );
  }

  updates.updatedAt = new Date().toISOString();

  await docRef.update(updates);

  const updatedSnap = await docRef.get();
  return { workerId: updatedSnap.id, id: updatedSnap.id, ...updatedSnap.data() };
};

/**
 * Fetch verification status for worker.
 * @param {string} uid
 * @returns {Promise<Object>} Verification status summary
 */
export const getWorkerVerificationStatus = async (uid) => {
  const doc = await getWorkerDocByUserId(uid);
  const data = doc.data();

  return {
    workerId: doc.id,
    verificationStatus: data.verificationStatus || "pending",
    verificationReason: data.verificationReason || null,
    submittedAt: data.createdAt || null,
    updatedAt: data.updatedAt || null,
  };
};
