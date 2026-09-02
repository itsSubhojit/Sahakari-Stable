import { db } from "../config/firebase.js";

/**
 * Write a notification document to notifications/{recipientUid}/{auto-id}.
 *
 * Shape:
 *   recipientUid  - Firebase Auth UID of the user who receives this notification
 *   type          - e.g. "COUNTER_OFFER_RECEIVED", "BOOKING_STATUS_CHANGED"
 *   title         - Short human-readable title
 *   body          - Longer description
 *   data          - Arbitrary extra fields (bookingId, negotiationId, …)
 *   read          - false initially
 *   createdAt     - ISO timestamp
 *
 * @param {string} recipientUid
 * @param {string} type
 * @param {string} title
 * @param {string} body
 * @param {Object} [data={}]
 * @returns {Promise<string>} The new notification document ID
 */
export const createNotification = async (recipientUid, type, title, body, data = {}) => {
  const colRef = db.collection("notifications").doc(recipientUid).collection("items");
  const docRef = await colRef.add({
    type,
    title,
    body,
    data,
    read: false,
    createdAt: new Date().toISOString(),
  });
  return docRef.id;
};
