import { db } from "../../config/firebase.js";
import ApiError from "../../utils/ApiError.js";
import { generateSignedKYCUrl } from "../../utils/uploadToCloudinaryKYC.js";

/**
 * Helper to resolve cooperative member worker IDs for a given admin user.
 * Returns null if SUPER_ADMIN or global admin.
 * Returns array of worker document IDs if COOPERATIVE_ADMIN with an assigned cooperative.
 *
 * @param {Object} user - { uid, role }
 * @returns {Promise<Array<string> | null>}
 */
const getCooperativeMemberWorkerIds = async (user) => {
  if (!user || user.role === "SUPER_ADMIN") {
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
 * Helper to resolve a worker document snapshot by doc ID or by userId.
 * @param {string} workerIdOrUserId
 * @returns {Promise<FirebaseFirestore.QueryDocumentSnapshot | FirebaseFirestore.DocumentSnapshot>}
 */
const resolveWorkerDoc = async (workerIdOrUserId) => {
  if (!workerIdOrUserId) {
    throw new ApiError(400, "Worker ID is required");
  }

  // 1. Try document ID directly
  const docRef = db.collection("workers").doc(workerIdOrUserId);
  const snap = await docRef.get();
  if (snap.exists) {
    return snap;
  }

  // 2. Try query by userId
  const querySnap = await db
    .collection("workers")
    .where("userId", "==", workerIdOrUserId)
    .limit(1)
    .get();

  if (!querySnap.empty) {
    return querySnap.docs[0];
  }

  throw new ApiError(404, "Worker not found");
};

/**
 * GET /api/admin/workers/pending-verification
 * Fetches all workers currently awaiting KYC & skills verification.
 * Scoped to cooperative member workers if caller is COOPERATIVE_ADMIN.
 *
 * @param {Object} user - { uid, role }
 * @returns {Promise<Array<Object>>} List of pending workers
 */
export const getPendingVerificationWorkersService = async (user) => {
  const memberWorkerIds = await getCooperativeMemberWorkerIds(user);

  // COOPERATIVE_ADMIN with scoped memberWorkerIds
  if (memberWorkerIds !== null) {
    if (memberWorkerIds.length === 0) {
      return [];
    }

    const workerChunks = [];
    for (let i = 0; i < memberWorkerIds.length; i += 30) {
      workerChunks.push(memberWorkerIds.slice(i, i + 30));
    }

    const workers = [];
    for (const chunk of workerChunks) {
      const snap = await db
        .collection("workers")
        .where("__name__", "in", chunk)
        .where("verificationStatus", "==", "pending")
        .get();

      snap.forEach((doc) => {
        const data = doc.data();
        workers.push({
          id: doc.id,
          workerId: doc.id,
          userId: data.userId || null,
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          skills: Array.isArray(data.skills) ? data.skills : [],
          bio: data.bio || "",
          experience: data.experience || "",
          serviceRadius: data.serviceRadius || null,
          photoUrl: data.photoUrl || null,
          address: data.address || null,
          verificationStatus: data.verificationStatus || "pending",
          verificationReason: data.verificationReason || null,
          createdAt: data.createdAt || null,
          updatedAt: data.updatedAt || null,
        });
      });
    }

    workers.sort((a, b) => {
      if (!a.createdAt) return 1;
      if (!b.createdAt) return -1;
      return b.createdAt.localeCompare(a.createdAt);
    });

    return workers;
  }

  // SUPER_ADMIN / Global Admin
  const querySnap = await db
    .collection("workers")
    .where("verificationStatus", "==", "pending")
    .get();

  const workers = [];
  querySnap.forEach((doc) => {
    const data = doc.data();
    workers.push({
      id: doc.id,
      workerId: doc.id,
      userId: data.userId || null,
      name: data.name || "",
      email: data.email || "",
      phone: data.phone || "",
      skills: Array.isArray(data.skills) ? data.skills : [],
      bio: data.bio || "",
      experience: data.experience || "",
      serviceRadius: data.serviceRadius || null,
      photoUrl: data.photoUrl || null,
      address: data.address || null,
      verificationStatus: data.verificationStatus || "pending",
      verificationReason: data.verificationReason || null,
      createdAt: data.createdAt || null,
      updatedAt: data.updatedAt || null,
    });
  });

  workers.sort((a, b) => {
    if (!a.createdAt) return 1;
    if (!b.createdAt) return -1;
    return b.createdAt.localeCompare(a.createdAt);
  });

  return workers;
};

/**
 * GET /api/admin/workers/:id/documents
 * Fetches all KYC documents uploaded by a worker, attaching fresh 15-min signed Cloudinary URLs.
 * Enforces cooperative data isolation for COOPERATIVE_ADMIN.
 *
 * @param {Object} user - { uid, role }
 * @param {string} workerIdOrUserId
 * @returns {Promise<Object>} Worker documents list and worker summary
 */
export const getWorkerDocumentsAdminService = async (user, workerIdOrUserId) => {
  const workerDoc = await resolveWorkerDoc(workerIdOrUserId);
  const workerId = workerDoc.id;
  const workerData = workerDoc.data();

  // Enforce Cooperative Scoping
  const memberWorkerIds = await getCooperativeMemberWorkerIds(user);
  if (memberWorkerIds !== null && !memberWorkerIds.includes(workerId)) {
    throw new ApiError(404, "Worker not found"); // 404 to prevent leaking existence
  }

  // Query workerDocuments by workerId
  const docsSnap = await db
    .collection("workerDocuments")
    .where("workerId", "==", workerId)
    .get();

  const documents = [];
  docsSnap.forEach((docSnap) => {
    const docData = docSnap.data();
    const signedUrl = generateSignedKYCUrl(docData.cloudinaryPublicId, docData.resourceType);

    documents.push({
      id: docSnap.id,
      docId: docSnap.id,
      workerId: docData.workerId,
      userId: docData.userId,
      docType: docData.docType,
      fileName: docData.fileName,
      mimeType: docData.mimeType,
      size: docData.size,
      verified: Boolean(docData.verified),
      signedUrl,
      createdAt: docData.createdAt,
    });
  });

  return {
    worker: {
      id: workerDoc.id,
      workerId: workerDoc.id,
      name: workerData.name || "",
      email: workerData.email || "",
      skills: Array.isArray(workerData.skills) ? workerData.skills : [],
      bio: workerData.bio || "",
      experience: workerData.experience || "",
      verificationStatus: workerData.verificationStatus || "pending",
    },
    documents,
  };
};

/**
 * PATCH /api/admin/workers/:id/verify
 * Approves or rejects a worker's profile & KYC verification status.
 * Also updates the `verified` flag on their linked `workerDocuments`.
 * Enforces cooperative data isolation for COOPERATIVE_ADMIN.
 *
 * @param {Object} user - { uid, role }
 * @param {string} workerIdOrUserId
 * @param {Object} payload - { status: "verified" | "rejected", reason?: string }
 * @returns {Promise<Object>} Updated worker document
 */
export const verifyWorkerService = async (user, workerIdOrUserId, payload = {}) => {
  const { status, reason } = payload;

  if (!status || !["verified", "rejected"].includes(status)) {
    throw new ApiError(
      400,
      "Invalid or missing status. Status must be either 'verified' or 'rejected'"
    );
  }

  const workerDoc = await resolveWorkerDoc(workerIdOrUserId);
  const workerId = workerDoc.id;

  // Enforce Cooperative Scoping
  const memberWorkerIds = await getCooperativeMemberWorkerIds(user);
  if (memberWorkerIds !== null && !memberWorkerIds.includes(workerId)) {
    throw new ApiError(404, "Worker not found"); // 404 to prevent leaking existence
  }

  const now = new Date().toISOString();

  const isApproved = status === "verified";
  const verificationReason = isApproved
    ? null
    : reason && String(reason).trim()
    ? String(reason).trim()
    : "Verification rejected by admin";

  const batch = db.batch();

  // 1. Update worker doc
  batch.update(workerDoc.ref, {
    verificationStatus: status,
    verificationReason,
    updatedAt: now,
  });

  // 2. Update linked workerDocuments verification state
  const docsSnap = await db
    .collection("workerDocuments")
    .where("workerId", "==", workerId)
    .get();

  docsSnap.forEach((docSnap) => {
    batch.update(docSnap.ref, {
      verified: isApproved,
      updatedAt: now,
    });
  });

  await batch.commit();

  const updatedSnap = await workerDoc.ref.get();
  return { id: updatedSnap.id, workerId: updatedSnap.id, ...updatedSnap.data() };
};
