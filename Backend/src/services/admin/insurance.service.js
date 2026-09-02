import { db } from "../../config/firebase.js";
import ApiError from "../../utils/ApiError.js";
import { generateSignedKYCUrl } from "../../utils/uploadToCloudinaryKYC.js";

const VALID_CLAIM_STATUSES = ["SUBMITTED", "APPROVED", "REJECTED"];

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
 * GET /api/admin/insurance-claims
 * Search & filter insurance claims across the platform or scoped to a cooperative.
 *
 * @param {Object} user - { uid, role }
 * @param {Object} queryParams - { status, limit }
 * @returns {Promise<Object>} Claims list and pagination metadata
 */
export const getAdminInsuranceClaimsService = async (user, queryParams = {}) => {
  const { status, limit: rawLimit } = queryParams;

  if (status && !VALID_CLAIM_STATUSES.includes(status.toUpperCase())) {
    throw new ApiError(
      400,
      `Invalid status filter '${status}'. Allowed values: ${VALID_CLAIM_STATUSES.join(", ")}`
    );
  }

  const filterStatus = status ? status.toUpperCase() : null;
  const limit = Math.min(Math.max(parseInt(rawLimit, 10) || 20, 1), 100);

  const memberWorkerIds = await getCooperativeMemberWorkerIds(user);

  // ── CASE 1: COOPERATIVE_ADMIN with memberWorkerIds scoping ──────────────────
  if (memberWorkerIds !== null) {
    if (memberWorkerIds.length === 0) {
      return { claims: [], count: 0, limit };
    }

    const workerChunks = [];
    for (let i = 0; i < memberWorkerIds.length; i += 30) {
      workerChunks.push(memberWorkerIds.slice(i, i + 30));
    }

    const claimsMap = new Map();

    for (const chunk of workerChunks) {
      let q = db.collection("insuranceClaims").where("workerId", "in", chunk);
      if (filterStatus) {
        q = q.where("status", "==", filterStatus);
      }
      const snap = await q.get();
      snap.forEach((doc) => {
        claimsMap.set(doc.id, { id: doc.id, ...doc.data() });
      });
    }

    const claims = Array.from(claimsMap.values());
    claims.sort((a, b) => {
      if (!a.submittedAt) return 1;
      if (!b.submittedAt) return -1;
      return b.submittedAt.localeCompare(a.submittedAt);
    });

    const paginatedClaims = claims.slice(0, limit);
    return {
      claims: paginatedClaims,
      count: paginatedClaims.length,
      totalCount: claims.length,
      limit,
    };
  }

  // ── CASE 2: SUPER_ADMIN / Global Admin ────────────────────────────────────────
  let query = db.collection("insuranceClaims");
  if (filterStatus) {
    query = query.where("status", "==", filterStatus);
  }

  const snap = await query.limit(limit).get();
  const claims = [];
  snap.forEach((doc) => {
    claims.push({ id: doc.id, ...doc.data() });
  });

  claims.sort((a, b) => {
    if (!a.submittedAt) return 1;
    if (!b.submittedAt) return -1;
    return b.submittedAt.localeCompare(a.submittedAt);
  });

  return {
    claims,
    count: claims.length,
    limit,
  };
};

/**
 * GET /api/admin/insurance-claims/:id
 * Fetches comprehensive claim details with worker info, linked booking info, and fresh 15-min signed Cloudinary URLs.
 *
 * @param {Object} user - { uid, role }
 * @param {string} claimId
 * @returns {Promise<Object>} Full insurance claim detail profile
 */
export const getAdminInsuranceClaimByIdService = async (user, claimId) => {
  if (!claimId) {
    throw new ApiError(400, "Claim ID is required");
  }

  const claimSnap = await db.collection("insuranceClaims").doc(claimId).get();
  if (!claimSnap.exists) {
    throw new ApiError(404, "Insurance claim not found");
  }

  const claimData = claimSnap.data();

  // Enforce Cooperative RBAC Scope
  const memberWorkerIds = await getCooperativeMemberWorkerIds(user);
  if (memberWorkerIds !== null && !memberWorkerIds.includes(claimData.workerId)) {
    throw new ApiError(404, "Insurance claim not found"); // 404 to avoid leaking existence
  }

  // Fetch linked worker and booking documents
  const workerPromise = claimData.workerId
    ? db.collection("workers").doc(claimData.workerId).get()
    : Promise.resolve(null);

  const bookingPromise = claimData.bookingId
    ? db.collection("bookings").doc(claimData.bookingId).get()
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
      }
    : null;

  // Generate fresh 15-minute signed Cloudinary view URLs for each evidence item
  const evidenceWithSignedUrls = Array.isArray(claimData.evidence)
    ? claimData.evidence.map((item) => ({
        ...item,
        signedUrl: generateSignedKYCUrl(item.cloudinaryPublicId, item.resourceType),
      }))
    : [];

  return {
    id: claimSnap.id,
    claimId: claimSnap.id,
    workerId: claimData.workerId || null,
    bookingId: claimData.bookingId || null,
    caseType: claimData.caseType || "",
    claimedAmount: claimData.claimedAmount || 0,
    description: claimData.description || "",
    incidentDate: claimData.incidentDate || null,
    incidentTime: claimData.incidentTime || null,
    policeReportRequired: Boolean(claimData.policeReportRequired),
    status: claimData.status || "SUBMITTED",
    submittedAt: claimData.submittedAt || null,
    updatedAt: claimData.updatedAt || null,
    reviewedBy: claimData.reviewedBy || null,
    reviewReason: claimData.reviewReason || null,
    reviewedAt: claimData.reviewedAt || null,
    worker: workerInfo,
    booking: bookingInfo,
    evidence: evidenceWithSignedUrls,
  };
};

/**
 * PATCH /api/admin/insurance-claims/:id/status
 * Approves or rejects a worker insurance claim.
 *
 * @param {Object} user - { uid, role }
 * @param {string} claimId
 * @param {Object} body - { status, reason }
 * @returns {Promise<Object>} Updated claim document
 */
export const updateAdminInsuranceClaimStatusService = async (user, claimId, body) => {
  if (!claimId) {
    throw new ApiError(400, "Claim ID is required");
  }

  const { status, reason } = body;

  if (!status || !["APPROVED", "REJECTED"].includes(status.toUpperCase())) {
    throw new ApiError(
      400,
      "Invalid or missing status. Status must be either 'APPROVED' or 'REJECTED'"
    );
  }

  const newStatus = status.toUpperCase();

  const claimRef = db.collection("insuranceClaims").doc(claimId);
  const claimSnap = await claimRef.get();

  if (!claimSnap.exists) {
    throw new ApiError(404, "Insurance claim not found");
  }

  const claimData = claimSnap.data();

  // Enforce Cooperative RBAC Scope
  const memberWorkerIds = await getCooperativeMemberWorkerIds(user);
  if (memberWorkerIds !== null && !memberWorkerIds.includes(claimData.workerId)) {
    throw new ApiError(404, "Insurance claim not found"); // 404 to avoid leaking existence
  }

  if (claimData.status !== "SUBMITTED") {
    throw new ApiError(
      400,
      `Claim has already been processed (current status: ${claimData.status})`
    );
  }

  const now = new Date().toISOString();
  const updates = {
    status: newStatus,
    reviewReason: reason && typeof reason === "string" ? reason.trim() : null,
    reviewedBy: user.uid,
    reviewedAt: now,
    updatedAt: now,
  };

  await claimRef.update(updates);

  const updatedSnap = await claimRef.get();
  return { id: updatedSnap.id, ...updatedSnap.data() };
};
