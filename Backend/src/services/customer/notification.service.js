import { db } from "../../config/firebase.js";
import ApiError from "../../utils/ApiError.js";

/**
 * Fetch all notification items for a user, newest first.
 * Optionally filter to unread only.
 *
 * @param {string} uid
 * @param {boolean} [unreadOnly=false]
 * @returns {Promise<Array<Object>>}
 */
export const getNotificationsService = async (uid, unreadOnly = false) => {
  const snapshot = await db
    .collection("notifications")
    .doc(uid)
    .collection("items")
    .get();

  let notifications = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  // Sort in memory by createdAt descending
  notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (unreadOnly) {
    notifications = notifications.filter((n) => n.read === false);
  }

  return notifications;
};

/**
 * Mark a single notification item as read.
 *
 * @param {string} uid
 * @param {string} notificationId
 * @returns {Promise<Object>} Updated notification document
 */
export const markNotificationReadService = async (uid, notificationId) => {
  const docRef = db
    .collection("notifications")
    .doc(uid)
    .collection("items")
    .doc(notificationId);

  const snap = await docRef.get();

  if (!snap.exists) {
    throw new ApiError(404, "Notification not found");
  }

  if (snap.data().read === true) {
    // Already read — return as-is, no unnecessary write
    return { id: snap.id, ...snap.data() };
  }

  await docRef.update({ read: true, readAt: new Date().toISOString() });

  const updated = await docRef.get();
  return { id: updated.id, ...updated.data() };
};
