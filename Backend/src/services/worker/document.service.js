import path from "path";
import { db } from "../../config/firebase.js";
import ApiError from "../../utils/ApiError.js";
import {
  uploadToCloudinaryKYC,
  generateSignedKYCUrl,
} from "../../utils/uploadToCloudinaryKYC.js";

const ALLOWED_DOC_TYPES = [
  "AADHAAR",
  "PAN",
  "DRIVING_LICENSE",
  "VOTER_ID",
  "WORK_CERTIFICATE",
  "OTHER",
];

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Helper to fetch worker document snapshot by user ID.
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
 * Upload a worker KYC document to Cloudinary (type: authenticated) & record in workerDocuments Firestore collection.
 * @param {string} uid - Firebase Auth user ID
 * @param {Object} file - Multer file object
 * @param {Object} body - Request body containing docType
 * @returns {Promise<Object>} Created workerDocument record
 */
export const uploadWorkerDocumentService = async (uid, file, body) => {
  if (!file) {
    throw new ApiError(400, "Document file is required");
  }

  const { docType } = body;
  if (!docType || !ALLOWED_DOC_TYPES.includes(docType)) {
    throw new ApiError(
      400,
      `Invalid or missing docType. Allowed values: ${ALLOWED_DOC_TYPES.join(", ")}`
    );
  }

  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    throw new ApiError(
      400,
      `Invalid file type '${file.mimetype}'. Allowed types: ${ALLOWED_MIME_TYPES.join(", ")}`
    );
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new ApiError(400, "File size exceeds maximum allowed limit of 5 MB");
  }

  const workerDoc = await getWorkerDocByUserId(uid);
  const workerId = workerDoc.id;

  // Extract base filename without extension to ensure clean Cloudinary public_id signature calculation
  const parsedName = path.parse(file.originalname).name;
  const sanitizedBaseName = parsedName.replace(/[^a-zA-Z0-9_-]/g, "_");
  const publicIdName = `${docType}_${Date.now()}_${sanitizedBaseName}`;

  // Upload to Cloudinary under folder "sahakari/worker/documents" with type "authenticated"
  const result = await uploadToCloudinaryKYC(file.buffer, file.mimetype, publicIdName);

  const now = new Date().toISOString();

  // Create Firestore record with PERMANENT publicId (NEVER storing temporary signed URL)
  const documentRecord = {
    workerId,
    userId: uid,
    docType,
    cloudinaryPublicId: result.publicId, // PERMANENT Cloudinary public_id
    resourceType: result.resourceType,   // "image" or "raw"
    fileName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    verified: false,                     // HARDCODED SERVER-SIDE
    createdAt: now,
  };

  const docRef = db.collection("workerDocuments").doc();
  await docRef.set(documentRecord);

  return {
    id: docRef.id,
    docId: docRef.id,
    ...documentRecord,
  };
};

/**
 * List all submitted KYC document records for the authenticated worker.
 * @param {string} uid
 * @returns {Promise<Array<Object>>} List of worker document records
 */
export const getWorkerDocumentsService = async (uid) => {
  const querySnap = await db.collection("workerDocuments").where("userId", "==", uid).get();

  const documents = [];
  querySnap.forEach((doc) => {
    documents.push({ id: doc.id, docId: doc.id, ...doc.data() });
  });

  return documents;
};

/**
 * Fetch a single KYC document record by ID for the authenticated worker, generating a fresh 15-minute signed URL.
 * @param {string} uid - Firebase Auth user ID
 * @param {string} docId - workerDocuments document ID
 * @returns {Promise<Object>} Document record with fresh signed view URL
 */
export const getWorkerDocumentByIdService = async (uid, docId) => {
  const docRef = db.collection("workerDocuments").doc(docId);
  const snap = await docRef.get();

  if (!snap.exists) {
    throw new ApiError(404, "Document not found");
  }

  const docData = snap.data();

  // Enforce ownership: only the worker who uploaded this document can view it via this endpoint
  if (docData.userId !== uid) {
    throw new ApiError(403, "Access denied: You do not own this document");
  }

  // Generate a fresh 15-minute signed URL on-the-fly per request (never stored/cached)
  const signedUrl = generateSignedKYCUrl(docData.cloudinaryPublicId, docData.resourceType);

  return {
    id: snap.id,
    docId: snap.id,
    ...docData,
    signedUrl, // Freshly generated on-the-fly, valid for 15 minutes
  };
};
