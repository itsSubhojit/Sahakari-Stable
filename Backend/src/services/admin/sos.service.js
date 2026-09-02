import { db } from "../../config/firebase.js";
import ApiError from "../../utils/ApiError.js";

const VALID_ALERT_STATUSES = ["OPEN", "RESOLVED"];

/**
 * Helper to resolve cooperative member worker IDs for a given admin user.
 * Returns null if SUPER_ADMIN or global admin.
 * Returns array of worker document IDs if COOPERATIVE_ADMIN with an assigned cooperative.
 *
 * @param {Object} user - { uid, role }
 * @returns {Promise<Array<string> | null>}
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
 * GET /api/admin/sos/alerts
 * Search & filter SOS safety alerts across the platform or scoped to a cooperative.
 *
 * @param {Object} user - { uid, role }
 * @param {Object} queryParams - { status, limit }
 * @returns {Promise<Object>} Alerts list and pagination metadata
 */
export const getAdminSosAlertsService = async (user, queryParams = {}) => {
  const { status, limit: rawLimit } = queryParams;

  if (status && !VALID_ALERT_STATUSES.includes(status.toUpperCase())) {
    throw new ApiError(
      400,
      `Invalid status filter '${status}'. Allowed values: ${VALID_ALERT_STATUSES.join(", ")}`
    );
  }

  const filterStatus = status ? status.toUpperCase() : null;
  const limit = Math.min(Math.max(parseInt(rawLimit, 10) || 20, 1), 100);

  const memberWorkerIds = await getCooperativeMemberWorkerIds(user);

  // ── CASE 1: COOPERATIVE_ADMIN with memberWorkerIds scoping ──────────────────
  if (memberWorkerIds !== null) {
    if (memberWorkerIds.length === 0) {
      return { alerts: [], count: 0, limit };
    }

    const workerChunks = [];
    for (let i = 0; i < memberWorkerIds.length; i += 30) {
      workerChunks.push(memberWorkerIds.slice(i, i + 30));
    }

    const alertsMap = new Map();

    for (const chunk of workerChunks) {
      let q = db.collection("safetyAlerts").where("workerId", "in", chunk);
      if (filterStatus) {
        q = q.where("status", "==", filterStatus);
      }
      const snap = await q.get();
      snap.forEach((doc) => {
        alertsMap.set(doc.id, { id: doc.id, ...doc.data() });
      });
    }

    const alerts = Array.from(alertsMap.values());
    alerts.sort((a, b) => {
      const tsA = a.timestamp || a.createdAt || "";
      const tsB = b.timestamp || b.createdAt || "";
      return tsB.localeCompare(tsA);
    });

    const paginatedAlerts = alerts.slice(0, limit);
    return {
      alerts: paginatedAlerts,
      count: paginatedAlerts.length,
      totalCount: alerts.length,
      limit,
    };
  }

  // ── CASE 2: SUPER_ADMIN / Global Admin ────────────────────────────────────────
  let query = db.collection("safetyAlerts");
  if (filterStatus) {
    query = query.where("status", "==", filterStatus);
  }

  const snap = await query.limit(limit).get();
  const alerts = [];
  snap.forEach((doc) => {
    alerts.push({ id: doc.id, ...doc.data() });
  });

  alerts.sort((a, b) => {
    const tsA = a.timestamp || a.createdAt || "";
    const tsB = b.timestamp || b.createdAt || "";
    return tsB.localeCompare(tsA);
  });

  return {
    alerts,
    count: alerts.length,
    limit,
  };
};

/**
 * GET /api/admin/sos/alerts/:id
 * Fetches comprehensive SOS safety alert details with worker, linked booking, and location info.
 *
 * @param {Object} user - { uid, role }
 * @param {string} alertId
 * @returns {Promise<Object>} Full safety alert detail profile
 */
export const getAdminSosAlertByIdService = async (user, alertId) => {
  if (!alertId) {
    throw new ApiError(400, "Alert ID is required");
  }

  const alertSnap = await db.collection("safetyAlerts").doc(alertId).get();
  if (!alertSnap.exists) {
    throw new ApiError(404, "Safety alert not found");
  }

  const alertData = alertSnap.data();

  // Enforce Cooperative RBAC Scope
  const memberWorkerIds = await getCooperativeMemberWorkerIds(user);
  if (memberWorkerIds !== null && !memberWorkerIds.includes(alertData.workerId)) {
    throw new ApiError(404, "Safety alert not found"); // 404 to avoid leaking existence
  }

  // Fetch linked worker and booking documents
  const workerPromise = alertData.workerId
    ? db.collection("workers").doc(alertData.workerId).get()
    : Promise.resolve(null);

  const bookingPromise = alertData.bookingId
    ? db.collection("bookings").doc(alertData.bookingId).get()
    : Promise.resolve(null);

  const [workerSnap, bookingSnap] = await Promise.all([workerPromise, bookingPromise]);

  const workerInfo = workerSnap?.exists
    ? {
        id: workerSnap.id,
        workerId: workerSnap.id,
        name: workerSnap.data().name || "",
        email: workerSnap.data().email || "",
        phone: workerSnap.data().phone || "",
        skills: Array.isArray(workerSnap.data().skills) ? workerSnap.data().skills : [],
        verificationStatus: workerSnap.data().verificationStatus || "pending",
      }
    : null;

  const bookingInfo = bookingSnap?.exists
    ? {
        id: bookingSnap.id,
        bookingId: bookingSnap.id,
        status: bookingSnap.data().status || "",
        scheduledDate: bookingSnap.data().scheduledDate || null,
        scheduledTime: bookingSnap.data().scheduledTime || null,
        agreedPrice: bookingSnap.data().agreedPrice || 0,
        location: bookingSnap.data().location || null,
      }
    : null;

  return {
    id: alertSnap.id,
    alertId: alertSnap.id,
    workerId: alertData.workerId || null,
    bookingId: alertData.bookingId || null,
    location: alertData.location || null,
    status: alertData.status || "OPEN",
    timestamp: alertData.timestamp || alertData.createdAt || null,
    resolvedBy: alertData.resolvedBy || null,
    resolutionNotes: alertData.resolutionNotes || alertData.resolution || null,
    resolvedAt: alertData.resolvedAt || null,
    worker: workerInfo,
    booking: bookingInfo,
  };
};

/**
 * PATCH /api/admin/sos/alerts/:id/resolve
 * Resolves an open SOS safety alert.
 *
 * @param {Object} user - { uid, role }
 * @param {string} alertId
 * @param {Object} body - { resolutionNotes, resolution }
 * @returns {Promise<Object>} Updated alert document
 */
export const resolveAdminSosAlertService = async (user, alertId, body = {}) => {
  if (!alertId) {
    throw new ApiError(400, "Alert ID is required");
  }

  const alertRef = db.collection("safetyAlerts").doc(alertId);
  const alertSnap = await alertRef.get();

  if (!alertSnap.exists) {
    throw new ApiError(404, "Safety alert not found");
  }

  const alertData = alertSnap.data();

  // Enforce Cooperative RBAC Scope
  const memberWorkerIds = await getCooperativeMemberWorkerIds(user);
  if (memberWorkerIds !== null && !memberWorkerIds.includes(alertData.workerId)) {
    throw new ApiError(404, "Safety alert not found"); // 404 to avoid leaking existence
  }

  if (alertData.status === "RESOLVED") {
    throw new ApiError(400, "Safety alert is already resolved");
  }

  const { resolutionNotes, resolution } = body;
  const notesText = resolutionNotes || resolution || null;

  const now = new Date().toISOString();
  const updates = {
    status: "RESOLVED",
    resolutionNotes: notesText && typeof notesText === "string" ? notesText.trim() : null,
    resolvedBy: user.uid,
    resolvedAt: now,
    updatedAt: now,
  };

  await alertRef.update(updates);

  const updatedSnap = await alertRef.get();
  return { id: updatedSnap.id, ...updatedSnap.data() };
};
