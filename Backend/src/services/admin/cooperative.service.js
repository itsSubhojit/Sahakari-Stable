import { db } from "../../config/firebase.js";
import ApiError from "../../utils/ApiError.js";

/**
 * GET /api/admin/cooperatives
 * List cooperatives across the federation (SUPER_ADMIN) or scoped to the assigned cooperative (COOPERATIVE_ADMIN).
 *
 * @param {Object} user - { uid, role }
 * @returns {Promise<Object>} { cooperatives, count }
 */
export const getAdminCooperativesService = async (user) => {
  const isSuperAdmin = user.role === "SUPER_ADMIN";

  let cooperativeId = null;
  if (!isSuperAdmin) {
    const adminDoc = await db.collection("admins").doc(user.uid).get();
    const adminData = adminDoc.exists ? adminDoc.data() : {};
    cooperativeId = adminData.cooperativeId || null;
  }

  // SUPER_ADMIN or unassigned global admin -> list all cooperatives
  if (isSuperAdmin || !cooperativeId) {
    const snap = await db.collection("cooperatives").get();
    const cooperatives = [];
    snap.forEach((doc) => {
      cooperatives.push({ id: doc.id, ...doc.data() });
    });
    cooperatives.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    return { cooperatives, count: cooperatives.length };
  }

  // COOPERATIVE_ADMIN with assigned cooperativeId -> return only assigned cooperative
  const coopSnap = await db.collection("cooperatives").doc(cooperativeId).get();
  if (!coopSnap.exists) {
    return { cooperatives: [], count: 0 };
  }

  const coopData = { id: coopSnap.id, ...coopSnap.data() };
  return { cooperatives: [coopData], count: 1 };
};

/**
 * POST /api/admin/cooperatives
 * Creates a new cooperative entity in the cooperatives collection. (SUPER_ADMIN only)
 *
 * @param {Object} body - { name, code, region, description, status, adminUid, memberWorkerIds }
 * @returns {Promise<Object>} Created cooperative document
 */
export const createAdminCooperativeService = async (body) => {
  const { name, code, region, description, status, adminUid, memberWorkerIds } = body;

  if (!name || typeof name !== "string" || !name.trim()) {
    throw new ApiError(400, "Cooperative 'name' is required");
  }

  if (!code || typeof code !== "string" || !code.trim()) {
    throw new ApiError(400, "Cooperative 'code' is required");
  }

  const sanitizedCode = code.trim().toUpperCase();

  // Check for duplicate code
  const duplicateSnap = await db
    .collection("cooperatives")
    .where("code", "==", sanitizedCode)
    .get();

  if (!duplicateSnap.empty) {
    throw new ApiError(409, `Cooperative with code '${sanitizedCode}' already exists`);
  }

  const validStatuses = ["ACTIVE", "INACTIVE"];
  const sanitizedStatus = status && validStatuses.includes(status.toUpperCase())
    ? status.toUpperCase()
    : "ACTIVE";

  const memberIdsArray = Array.isArray(memberWorkerIds)
    ? memberWorkerIds.filter((id) => typeof id === "string" && id.trim())
    : [];

  const now = new Date().toISOString();

  const coopData = {
    name: name.trim(),
    code: sanitizedCode,
    region: region && typeof region === "string" ? region.trim() : "",
    description: description && typeof description === "string" ? description.trim() : "",
    status: sanitizedStatus,
    adminUid: adminUid && typeof adminUid === "string" ? adminUid.trim() : null,
    memberWorkerIds: memberIdsArray,
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await db.collection("cooperatives").add(coopData);

  return { id: docRef.id, ...coopData };
};

/**
 * GET /api/admin/cooperatives/:id
 * Fetches comprehensive cooperative profile and summary metrics (worker count, verifications, member list, active bookings).
 *
 * @param {Object} user - { uid, role }
 * @param {string} targetCoopId
 * @returns {Promise<Object>} Scoped cooperative profile and metrics
 */
export const getAdminCooperativeByIdService = async (user, targetCoopId) => {
  if (!targetCoopId) {
    throw new ApiError(400, "Cooperative ID is required");
  }

  const isSuperAdmin = user.role === "SUPER_ADMIN";

  if (!isSuperAdmin) {
    const adminDoc = await db.collection("admins").doc(user.uid).get();
    const adminData = adminDoc.exists ? adminDoc.data() : {};
    const assignedCoopId = adminData.cooperativeId || null;

    if (!assignedCoopId || assignedCoopId !== targetCoopId) {
      throw new ApiError(404, "Cooperative not found"); // 404 to avoid leaking existence
    }
  }

  const coopSnap = await db.collection("cooperatives").doc(targetCoopId).get();
  if (!coopSnap.exists) {
    throw new ApiError(404, "Cooperative not found");
  }

  const coopData = coopSnap.data();
  const memberWorkerIds = Array.isArray(coopData.memberWorkerIds) ? coopData.memberWorkerIds : [];

  let memberWorkers = [];
  let verifiedWorkersCount = 0;
  let pendingVerificationsCount = 0;
  let activeBookingsCount = 0;

  if (memberWorkerIds.length > 0) {
    const activeStatuses = [
      "PENDING_PAYMENT",
      "CONFIRMED",
      "WORKER_ACCEPTED",
      "ON_THE_WAY",
      "ARRIVED",
      "IN_PROGRESS",
    ];

    // Chunk worker IDs (Firestore 'in' supports max 30 per query)
    const workerChunks = [];
    for (let i = 0; i < memberWorkerIds.length; i += 30) {
      workerChunks.push(memberWorkerIds.slice(i, i + 30));
    }

    for (const chunk of workerChunks) {
      const [workersSnap, bookingsSnap] = await Promise.all([
        db.collection("workers").where("__name__", "in", chunk).get(),
        db.collection("bookings").where("workerId", "in", chunk).where("status", "in", activeStatuses).get(),
      ]);

      workersSnap.forEach((doc) => {
        const w = doc.data();
        const vStatus = w.verificationStatus || "pending";
        if (vStatus === "verified") verifiedWorkersCount++;
        else if (vStatus === "pending") pendingVerificationsCount++;

        memberWorkers.push({
          id: doc.id,
          workerId: doc.id,
          name: w.name || "",
          email: w.email || "",
          phone: w.phone || "",
          skills: Array.isArray(w.skills) ? w.skills : [],
          verificationStatus: vStatus,
        });
      });

      activeBookingsCount += bookingsSnap.size;
    }
  }

  return {
    id: coopSnap.id,
    cooperativeId: coopSnap.id,
    name: coopData.name || "",
    code: coopData.code || "",
    region: coopData.region || "",
    description: coopData.description || "",
    status: coopData.status || "ACTIVE",
    adminUid: coopData.adminUid || null,
    memberWorkerIds,
    createdAt: coopData.createdAt || null,
    updatedAt: coopData.updatedAt || null,
    metrics: {
      totalWorkers: memberWorkerIds.length,
      verifiedWorkers: verifiedWorkersCount,
      pendingVerifications: pendingVerificationsCount,
      activeBookings: activeBookingsCount,
    },
    memberWorkers,
  };
};
