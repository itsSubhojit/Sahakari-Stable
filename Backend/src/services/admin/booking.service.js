import { db } from "../../config/firebase.js";
import ApiError from "../../utils/ApiError.js";

const VALID_BOOKING_STATUSES = [
  "PENDING_PAYMENT",
  "CONFIRMED",
  "WORKER_ACCEPTED",
  "ON_THE_WAY",
  "ARRIVED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
];

/**
 * Helper to resolve cooperative member worker IDs for a given admin user.
 * Returns null if the caller is a SUPER_ADMIN or global admin (no cooperative scoping).
 * Returns array of worker document IDs if the caller is a COOPERATIVE_ADMIN with an assigned cooperative.
 *
 * @param {Object} user - { uid, role }
 * @returns {Promise<Array<string> | null>} List of memberWorkerIds or null for global access
 */
const getCooperativeMemberWorkerIds = async (user) => {
  if (user.role === "SUPER_ADMIN") {
    return null; // Global access
  }

  const adminDoc = await db.collection("admins").doc(user.uid).get();
  const adminData = adminDoc.exists ? adminDoc.data() : {};
  const cooperativeId = adminData.cooperativeId || null;

  if (!cooperativeId) {
    return null; // Global fallback if unassigned
  }

  const coopDoc = await db.collection("cooperatives").doc(cooperativeId).get();
  if (!coopDoc.exists) {
    throw new ApiError(404, `Assigned cooperative '${cooperativeId}' not found`);
  }

  const coopData = coopDoc.data();
  return Array.isArray(coopData.memberWorkerIds) ? coopData.memberWorkerIds : [];
};

/**
 * GET /api/admin/bookings
 * Search & filter bookings across the platform or scoped to a cooperative.
 *
 * @param {Object} user - { uid, role }
 * @param {Object} queryParams - { status, limit }
 * @returns {Promise<Object>} Bookings list and pagination metadata
 */
export const getAdminBookingsService = async (user, queryParams = {}) => {
  const { status, limit: rawLimit } = queryParams;

  if (status && !VALID_BOOKING_STATUSES.includes(status.toUpperCase())) {
    throw new ApiError(
      400,
      `Invalid status filter '${status}'. Allowed values: ${VALID_BOOKING_STATUSES.join(", ")}`
    );
  }

  const filterStatus = status ? status.toUpperCase() : null;
  const limit = Math.min(Math.max(parseInt(rawLimit, 10) || 20, 1), 100);

  const memberWorkerIds = await getCooperativeMemberWorkerIds(user);

  // ── CASE 1: COOPERATIVE_ADMIN with restricted memberWorkerIds ────────────────
  if (memberWorkerIds !== null) {
    if (memberWorkerIds.length === 0) {
      return { bookings: [], count: 0, limit };
    }

    // Chunk worker IDs (Firestore 'in' supports max 30 per query)
    const workerChunks = [];
    for (let i = 0; i < memberWorkerIds.length; i += 30) {
      workerChunks.push(memberWorkerIds.slice(i, i + 30));
    }

    const bookingsMap = new Map();

    for (const chunk of workerChunks) {
      let q = db.collection("bookings").where("workerId", "in", chunk);
      if (filterStatus) {
        q = q.where("status", "==", filterStatus);
      }
      const snap = await q.get();
      snap.forEach((doc) => {
        bookingsMap.set(doc.id, { id: doc.id, ...doc.data() });
      });
    }

    const bookings = Array.from(bookingsMap.values());
    bookings.sort((a, b) => {
      if (!a.createdAt) return 1;
      if (!b.createdAt) return -1;
      return b.createdAt.localeCompare(a.createdAt);
    });

    const paginatedBookings = bookings.slice(0, limit);
    return {
      bookings: paginatedBookings,
      count: paginatedBookings.length,
      totalCount: bookings.length,
      limit,
    };
  }

  // ── CASE 2: SUPER_ADMIN / Global Admin ────────────────────────────────────────
  let query = db.collection("bookings");
  if (filterStatus) {
    query = query.where("status", "==", filterStatus);
  }

  const snap = await query.limit(limit).get();
  const bookings = [];
  snap.forEach((doc) => {
    bookings.push({ id: doc.id, ...doc.data() });
  });

  // Sort in memory by createdAt descending
  bookings.sort((a, b) => {
    if (!a.createdAt) return 1;
    if (!b.createdAt) return -1;
    return b.createdAt.localeCompare(a.createdAt);
  });

  return {
    bookings,
    count: bookings.length,
    limit,
  };
};

/**
 * GET /api/admin/bookings/:id
 * Fetches comprehensive booking details including linked Customer, Worker, Service, Payment, & Negotiation data.
 *
 * @param {Object} user - { uid, role }
 * @param {string} bookingId
 * @returns {Promise<Object>} Full booking detail profile
 */
export const getAdminBookingByIdService = async (user, bookingId) => {
  if (!bookingId) {
    throw new ApiError(400, "Booking ID is required");
  }

  const bookingRef = db.collection("bookings").doc(bookingId);
  const bookingSnap = await bookingRef.get();

  if (!bookingSnap.exists) {
    throw new ApiError(404, "Booking not found");
  }

  const booking = bookingSnap.data();

  // Enforce Cooperative RBAC Scope
  const memberWorkerIds = await getCooperativeMemberWorkerIds(user);
  if (memberWorkerIds !== null && !memberWorkerIds.includes(booking.workerId)) {
    throw new ApiError(404, "Booking not found"); // 404 to avoid leaking existence
  }

  // Perform targeted parallel fetches for related entity documents (avoiding N+1)
  const customerPromise = booking.customerId
    ? db.collection("customers").doc(booking.customerId).get()
    : Promise.resolve(null);

  const workerPromise = booking.workerId
    ? db.collection("workers").doc(booking.workerId).get()
    : Promise.resolve(null);

  const servicePromise = booking.serviceId
    ? db.collection("services").doc(booking.serviceId).get()
    : Promise.resolve(null);

  const paymentPromise = db
    .collection("payments")
    .where("bookingId", "==", bookingId)
    .limit(1)
    .get();

  const negotiationPromise = booking.negotiationId
    ? db.collection("negotiations").doc(booking.negotiationId).get()
    : Promise.resolve(null);

  const [customerSnap, workerSnap, serviceSnap, paymentSnap, negotiationSnap] =
    await Promise.all([
      customerPromise,
      workerPromise,
      servicePromise,
      paymentPromise,
      negotiationPromise,
    ]);

  // Sanitize customer data (no private credentials)
  const customerData = customerSnap?.exists
    ? {
        id: customerSnap.id,
        name: customerSnap.data().name || "",
        email: customerSnap.data().email || "",
        phone: customerSnap.data().phone || "",
        address: customerSnap.data().address || "",
        photoUrl: customerSnap.data().photoUrl || null,
      }
    : null;

  // Sanitize worker data
  const workerData = workerSnap?.exists
    ? {
        id: workerSnap.id,
        workerId: workerSnap.id,
        name: workerSnap.data().name || "",
        email: workerSnap.data().email || "",
        phone: workerSnap.data().phone || "",
        skills: Array.isArray(workerSnap.data().skills) ? workerSnap.data().skills : [],
        verificationStatus: workerSnap.data().verificationStatus || "pending",
        photoUrl: workerSnap.data().photoUrl || null,
      }
    : null;

  // Sanitize service data
  const serviceData = serviceSnap?.exists
    ? {
        id: serviceSnap.id,
        name: serviceSnap.data().name || "",
        category: serviceSnap.data().category || "",
        basePrice: serviceSnap.data().basePrice || null,
      }
    : null;

  // Sanitize payment data (no secrets)
  let paymentData = null;
  if (paymentSnap && !paymentSnap.empty) {
    const p = paymentSnap.docs[0].data();
    paymentData = {
      id: paymentSnap.docs[0].id,
      amount: p.amount || 0,
      currency: p.currency || "INR",
      status: p.status || "",
      razorpayOrderId: p.razorpayOrderId || null,
      razorpayPaymentId: p.razorpayPaymentId || null,
      createdAt: p.createdAt || null,
    };
  }

  // Sanitize negotiation data
  const negotiationData = negotiationSnap?.exists
    ? {
        id: negotiationSnap.id,
        agreedPrice: negotiationSnap.data().agreedPrice || null,
        status: negotiationSnap.data().status || "",
        priceHistory: Array.isArray(negotiationSnap.data().priceHistory)
          ? negotiationSnap.data().priceHistory
          : [],
      }
    : null;

  return {
    id: bookingSnap.id,
    bookingId: bookingSnap.id,
    requestId: booking.requestId || null,
    agreedPrice: booking.agreedPrice || 0,
    status: booking.status || "",
    paymentStatus: booking.paymentStatus || null,
    scheduledDate: booking.scheduledDate || null,
    scheduledTime: booking.scheduledTime || null,
    location: booking.location || null,
    cancellationReason: booking.cancellationReason || null,
    cancelledBy: booking.cancelledBy || null,
    createdAt: booking.createdAt || null,
    updatedAt: booking.updatedAt || null,
    completedAt: booking.completedAt || null,
    customer: customerData,
    worker: workerData,
    service: serviceData,
    payment: paymentData,
    negotiation: negotiationData,
  };
};
