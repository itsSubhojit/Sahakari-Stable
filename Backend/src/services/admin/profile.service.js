import { db } from "../../config/firebase.js";
import ApiError from "../../utils/ApiError.js";

/**
 * Fetch Admin profile by Firebase Auth UID.
 * Reads document from admins/{uid}.
 *
 * @param {string} uid - Firebase Auth UID
 * @returns {Promise<Object>} Admin document data
 */
export const getAdminProfileService = async (uid) => {
  const docRef = db.collection("admins").doc(uid);
  const snap = await docRef.get();

  if (!snap.exists) {
    throw new ApiError(404, "Admin profile not found");
  }

  return { id: snap.id, ...snap.data() };
};
