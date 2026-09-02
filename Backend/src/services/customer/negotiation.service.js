import { db } from "../../config/firebase.js";
import ApiError from "../../utils/ApiError.js";
import { createNotification } from "../../utils/createNotification.js";

/**
 * Verify turn and ownership of a negotiation thread.
 * Ensures caller is an exact participant of the thread and it is currently their turn.
 *
 * @param {Object} user - { uid, role } from req.user
 * @param {Object} neg - Negotiation document data
 */
const verifyNegotiationParticipant = async (user, neg) => {
  const { uid, role } = user;

  if (neg.status !== "PENDING") {
    throw new ApiError(400, `Cannot act on negotiation: thread is already ${neg.status.toLowerCase()}`);
  }

  // Turn checks
  if (neg.turnOf === "CUSTOMER") {
    if (role !== "CUSTOMER") {
      throw new ApiError(400, "It is not your turn to act in this negotiation thread");
    }
    if (neg.customerId !== uid) {
      throw new ApiError(403, "Forbidden: You are not the customer of this negotiation thread");
    }
  } else if (neg.turnOf === "WORKER") {
    if (role !== "GIG_WORKER") {
      throw new ApiError(400, "It is not your turn to act in this negotiation thread");
    }

    // Verify worker ownership: check if workerId matches uid OR caller's worker doc ID
    let isWorker = neg.workerId === uid;
    if (!isWorker) {
      const workerQuery = await db.collection("workers").where("userId", "==", uid).limit(1).get();
      if (!workerQuery.empty && workerQuery.docs[0].id === neg.workerId) {
        isWorker = true;
      }
    }

    if (!isWorker) {
      throw new ApiError(403, "Forbidden: You are not the assigned worker of this negotiation thread");
    }
  } else {
    throw new ApiError(400, "Invalid turn state in negotiation thread");
  }
};

/**
 * Send a counter offer on a pending negotiation thread.
 * Supports both CUSTOMER and GIG_WORKER when it is their turn.
 *
 * @param {Object} user - { uid, role }
 * @param {string} negotiationId
 * @param {Object} data - { amount, note }
 * @returns {Promise<Object>} Updated negotiation document
 */
export const counterNegotiationService = async (user, negotiationId, data) => {
  const { amount, note } = data;

  if (amount === undefined || isNaN(Number(amount)) || Number(amount) <= 0) {
    throw new ApiError(400, "A valid positive numeric amount is required for counter offer");
  }

  const docRef = db.collection("negotiations").doc(negotiationId);
  const snap = await docRef.get();

  if (!snap.exists) {
    throw new ApiError(404, "Negotiation thread not found");
  }

  const neg = snap.data();

  // Verify caller's turn and thread ownership
  await verifyNegotiationParticipant(user, neg);

  const now = new Date().toISOString();
  const nextTurn = user.role === "CUSTOMER" ? "WORKER" : "CUSTOMER";

  const newHistoryItem = {
    proposedBy: user.role,
    amount: Number(amount),
    note: note || "",
    timestamp: now,
  };

  const updatedHistory = [...(neg.priceHistory || []), newHistoryItem];

  const updates = {
    priceHistory: updatedHistory,
    turnOf: nextTurn,
    updatedAt: now,
  };

  await docRef.update(updates);

  // Notify the OTHER participant that a counter-offer arrived (fire-and-forget)
  const recipientUid = user.role === "CUSTOMER" ? neg.workerId : neg.customerId;
  createNotification(
    recipientUid,
    "COUNTER_OFFER_RECEIVED",
    "New counter-offer received",
    `A ${user.role === "CUSTOMER" ? "customer" : "worker"} sent a counter-offer of ₹${Number(amount).toFixed(2)}`,
    { negotiationId, amount: Number(amount), proposedBy: user.role }
  ).catch(() => {}); // never block the response

  const updatedSnap = await docRef.get();
  return { id: updatedSnap.id, ...updatedSnap.data() };
};

/**
 * Accept the proposed offer in a negotiation thread.
 * Supports both CUSTOMER and GIG_WORKER when it is their turn.
 *
 * @param {Object} user - { uid, role }
 * @param {string} negotiationId
 * @returns {Promise<Object>} { negotiation, bookingId }
 */
export const acceptNegotiationService = async (user, negotiationId) => {
  const negRef = db.collection("negotiations").doc(negotiationId);
  const snap = await negRef.get();

  if (!snap.exists) {
    throw new ApiError(404, "Negotiation thread not found");
  }

  const neg = snap.data();

  // Verify caller's turn and thread ownership
  await verifyNegotiationParticipant(user, neg);

  const priceHistory = neg.priceHistory || [];
  if (priceHistory.length === 0) {
    throw new ApiError(400, "No price proposal found in negotiation history");
  }

  // Agreed price is the latest proposed amount in history
  const lastProposedItem = priceHistory[priceHistory.length - 1];
  const agreedPrice = Number(lastProposedItem.amount);

  // Retrieve service request details
  const reqRef = db.collection("serviceRequests").doc(neg.requestId);
  const reqSnap = await reqRef.get();
  if (!reqSnap.exists) {
    throw new ApiError(404, "Associated service request not found");
  }
  const reqData = reqSnap.data();

  const now = new Date().toISOString();

  // 1. Accept this negotiation thread
  await negRef.update({
    status: "ACCEPTED",
    agreedPrice,
    updatedAt: now,
  });

  // 2. Create bookings document with status PENDING_PAYMENT
  const bookingData = {
    requestId: neg.requestId,
    negotiationId: snap.id,
    customerId: neg.customerId,
    workerId: neg.workerId,
    serviceId: reqData.serviceId,
    agreedPrice,
    status: "PENDING_PAYMENT",
    location: reqData.location,
    scheduledDate: reqData.preferredDate,
    scheduledTime: reqData.preferredTime,
    createdAt: now,
    updatedAt: now,
  };

  const bookingRef = await db.collection("bookings").add(bookingData);

  // 3. Mark service request as CONFIRMED
  await reqRef.update({
    status: "CONFIRMED",
    updatedAt: now,
  });

  // 4. Auto-reject every OTHER PENDING negotiation thread on the same requestId
  const otherNegsSnap = await db
    .collection("negotiations")
    .where("requestId", "==", neg.requestId)
    .get();

  const batch = db.batch();
  let otherCount = 0;

  otherNegsSnap.forEach((otherDoc) => {
    if (otherDoc.id !== snap.id && otherDoc.data().status === "PENDING") {
      batch.update(otherDoc.ref, {
        status: "REJECTED",
        rejectionReason: "Accepted another offer",
        updatedAt: now,
      });
      otherCount++;
    }
  });

  if (otherCount > 0) {
    await batch.commit();
  }

  const updatedNegSnap = await negRef.get();

  // Notify both parties that a booking has been created (fire-and-forget)
  const bookingMsg = `Your negotiation was accepted. Booking ID: ${bookingRef.id}. Agreed price: ₹${agreedPrice.toFixed(2)}`;
  createNotification(
    neg.customerId,
    "BOOKING_CREATED",
    "Booking confirmed!",
    bookingMsg,
    { bookingId: bookingRef.id, agreedPrice }
  ).catch(() => {});
  createNotification(
    neg.workerId,
    "BOOKING_CREATED",
    "Booking confirmed!",
    bookingMsg,
    { bookingId: bookingRef.id, agreedPrice }
  ).catch(() => {});

  return {
    negotiation: { id: updatedNegSnap.id, ...updatedNegSnap.data() },
    bookingId: bookingRef.id,
  };
};

/**
 * Reject an offer in a negotiation thread.
 * Supports both CUSTOMER and GIG_WORKER when it is their turn.
 *
 * @param {Object} user - { uid, role }
 * @param {string} negotiationId
 * @returns {Promise<Object>} Updated negotiation document
 */
export const rejectNegotiationService = async (user, negotiationId) => {
  const docRef = db.collection("negotiations").doc(negotiationId);
  const snap = await docRef.get();

  if (!snap.exists) {
    throw new ApiError(404, "Negotiation thread not found");
  }

  const neg = snap.data();

  // Verify caller's turn and thread ownership
  await verifyNegotiationParticipant(user, neg);

  const now = new Date().toISOString();
  await docRef.update({
    status: "REJECTED",
    rejectionReason: `Rejected by ${user.role.toLowerCase()}`,
    updatedAt: now,
  });

  const updatedSnap = await docRef.get();
  return { id: updatedSnap.id, ...updatedSnap.data() };
};
