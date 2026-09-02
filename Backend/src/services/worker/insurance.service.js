import { db } from "../../config/firebase.js";
import ApiError from "../../utils/ApiError.js";
import {
  uploadToCloudinaryKYC,
  generateSignedKYCUrl,
} from "../../utils/uploadToCloudinaryKYC.js";

// ── Constants ─────────────────────────────────────────────────────────────────

const CLAIM_AMOUNTS = {
  MINOR_INJURY: 5000,
  MAJOR_INJURY: 50000,
  PERMANENT_DISABILITY: 200000,
  DEATH: 500000,
};

const VALID_CASE_TYPES = Object.keys(CLAIM_AMOUNTS);
const REQUIRES_POLICE_REPORT = new Set(["MAJOR_INJURY", "PERMANENT_DISABILITY", "DEATH"]);

// Derive fileType label from mimetype
const mimetypeToFileType = (mime) => {
  if (mime.startsWith("video/")) return "video";
  if (mime === "application/pdf") return "document";
  return "photo";
};

/**
 * Reconstruct a full UTC Date from an IST incidentDate + incidentTime.
 * incidentDate: "YYYY-MM-DD", incidentTime: "HH:MM"
 * IST = UTC+5:30, so we append "+05:30" and let the Date constructor
 * normalise to UTC. This is consistent with how CLOCK_IN/CLOCK_OUT
 * timestamps are written (new Date().toISOString() = UTC).
 */
const reconstructIncidentUtc = (incidentDate, incidentTime) => {
  // INCIDENT DATE/TIME are supplied in IST (UTC+5:30) by the client.
  // We append the IST offset and let the JS Date constructor convert it to UTC.
  // All workerShiftLogs timestamps (CLOCK_IN / CLOCK_OUT) are stored as UTC ISO strings via new Date().toISOString().
  // Therefore, both the incident timestamp and shift logs are comparable in UTC without further conversion.
  const isoString = `${incidentDate}T${incidentTime}:00+05:30`;
  const dt = new Date(isoString);
  if (isNaN(dt.getTime())) {
    throw new ApiError(400, "incidentDate/incidentTime are not a valid date-time combination");
  }
  return dt;
};

// ── Working-Hours Validation ──────────────────────────────────────────────────

/**
 * Checks condition A: the linked booking's scheduledDate matches incidentDate.
 * We treat scheduledDate as an IST calendar date (YYYY-MM-DD) — same as how
 * customers submit it. An incident "during" the booking means the incidentDate
 * falls on the booking's scheduledDate.
 */
const checkBookingCoverage = async (bookingId, incidentDateStr) => {
  if (!bookingId) return false;
  const bookingSnap = await db.collection("bookings").doc(bookingId).get();
  if (!bookingSnap.exists) return false;
  const booking = bookingSnap.data();
  return booking.scheduledDate === incidentDateStr;
};

/**
 * Checks condition B: the worker had an active CLOCK_IN in workerShiftLogs
 * at the exact instant of the incident (i.e., the most recent log entry
 * before the incident time has type CLOCK_IN, meaning no CLOCK_OUT intervened).
 * All comparisons are UTC ISO strings, consistent with how W9 stores logs.
 */
const checkShiftLogCoverage = async (workerId, incidentUtc) => {
  const incidentIso = incidentUtc.toISOString();

  // workerShiftLogs timestamps are stored as UTC ISO strings, so we can compare directly.
  // We fetch all logs for the worker and filter for CLOCK_IN/CLOCK_OUT entries up to the incident time.
  const logsSnap = await db.collection("workerShiftLogs")
    .where("workerId", "==", workerId)
    .get();

  const relevantLogs = [];
  logsSnap.forEach((doc) => {
    const data = doc.data();
    if (
      (data.type === "CLOCK_IN" || data.type === "CLOCK_OUT") &&
      data.timestamp <= incidentIso
    ) {
      relevantLogs.push(data);
    }
  });

  if (relevantLogs.length === 0) return false;

  // Sort descending — most-recent-before-incident first
  relevantLogs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  // If the last entry before the incident is CLOCK_IN, the worker was on-shift
  return relevantLogs[0].type === "CLOCK_IN";
};

// ── Service Functions ─────────────────────────────────────────────────────────

/**
 * POST /api/worker/insurance-claims
 * Validates, uploads evidence to Cloudinary, and persists the claim.
 */
export const submitInsuranceClaim = async (uid, files, body) => {
  const { caseType, description, incidentDate, incidentTime, bookingId } = body;

  // 1. Resolve worker + verification gate
  const workerSnap = await db.collection("workers").where("userId", "==", uid).limit(1).get();
  if (workerSnap.empty) throw new ApiError(404, "Worker profile not found");
  const workerDoc = workerSnap.docs[0];
  const workerId = workerDoc.id;
  const workerData = workerDoc.data();

  if (workerData.verificationStatus !== "verified") {
    throw new ApiError(
      403,
      `You must be verified to submit an insurance claim. Your current status: ${workerData.verificationStatus || "unknown"}`
    );
  }

  // 2. caseType validation
  if (!caseType || !VALID_CASE_TYPES.includes(caseType)) {
    throw new ApiError(400, `caseType must be one of: ${VALID_CASE_TYPES.join(", ")}`);
  }

  // 3. description required
  if (!description || !String(description).trim()) {
    throw new ApiError(400, "description is required");
  }

  // 4. Incident date/time — reconstruct UTC and validate not in future
  if (!incidentDate || !incidentTime) {
    throw new ApiError(400, "incidentDate (YYYY-MM-DD) and incidentTime (HH:MM) are required");
  }
  const incidentUtc = reconstructIncidentUtc(incidentDate, incidentTime);
  if (incidentUtc > new Date()) {
    throw new ApiError(400, "incidentDate/incidentTime must not be in the future");
  }

  // 5. At least one evidence file required
  if (!files || files.length === 0) {
    throw new ApiError(400, "At least one evidence file is required");
  }

  // 6. Police report requirement
  const policeReportRequired = REQUIRES_POLICE_REPORT.has(caseType);
  if (policeReportRequired) {
    const hasDoc = files.some((f) => mimetypeToFileType(f.mimetype) === "document");
    if (!hasDoc) {
      throw new ApiError(
        400,
        `${caseType} requires at least one police report document (PDF) as evidence`
      );
    }
  }

  // 7. Working-hours validation (OR logic)
  const [bookingCovered, shiftCovered] = await Promise.all([
    checkBookingCoverage(bookingId || null, incidentDate),
    checkShiftLogCoverage(workerId, incidentUtc),
  ]);

  if (!bookingCovered && !shiftCovered) {
    throw new ApiError(
      400,
      "The incident time does not fall within a verifiable working period. " +
        "No booking or active shift log was found covering the stated incident time. " +
        "Insurance claims must occur during a scheduled booking or an active clocked-in shift."
    );
  }

  // 8. Upload evidence to Cloudinary
  const evidence = [];
  for (const file of files) {
    const publicIdName = `insurance_${workerId}_${Date.now()}_${file.originalname.replace(/\s+/g, "_")}`;
    const fileType = mimetypeToFileType(file.mimetype);

    // Route video to resource_type "video", others handled by existing util
    let uploadResult;
    if (fileType === "video") {
      const { default: cloudinary } = await import("../../config/cloudinary.js");
      uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "sahakari/worker/insurance",
            public_id: publicIdName,
            resource_type: "video",
            type: "authenticated",
            overwrite: false,
          },
          (err, result) => {
            if (err) return reject(new ApiError(500, `Cloudinary upload failed: ${err.message}`));
            resolve({ publicId: result.public_id, resourceType: "video", format: result.format });
          }
        );
        stream.end(file.buffer);
      });
    } else {
      // Reuse W2 utility for photo and document
      uploadResult = await uploadToCloudinaryKYC(file.buffer, file.mimetype, publicIdName);
      // Override folder to insurance path by using a distinct publicIdName prefix
    }

    evidence.push({
      cloudinaryPublicId: uploadResult.publicId,
      resourceType: uploadResult.resourceType,
      fileType,
    });
  }

  // 9. Build and persist claim — server-computed amount, never from client
  const now = new Date().toISOString();
  const claimData = {
    workerId,
    bookingId: bookingId || null,
    caseType,
    claimedAmount: CLAIM_AMOUNTS[caseType],
    description: String(description).trim(),
    incidentDate,
    incidentTime,
    evidence,
    policeReportRequired,
    status: "SUBMITTED",
    submittedAt: now,
    updatedAt: now,
  };

  const claimRef = await db.collection("insuranceClaims").add(claimData);
  return { id: claimRef.id, ...claimData };
};

/**
 * GET /api/worker/insurance-claims
 * Lists the worker's own claims (metadata only, no signed URLs).
 */
export const listInsuranceClaims = async (uid) => {
  const workerSnap = await db.collection("workers").where("userId", "==", uid).limit(1).get();
  if (workerSnap.empty) throw new ApiError(404, "Worker profile not found");
  const workerId = workerSnap.docs[0].id;

  const claimsSnap = await db.collection("insuranceClaims")
    .where("workerId", "==", workerId)
    .get();

  const claims = [];
  claimsSnap.forEach((doc) => {
    const { caseType, claimedAmount, status, submittedAt } = doc.data();
    claims.push({ id: doc.id, caseType, claimedAmount, status, submittedAt });
  });

  return claims;
};

/**
 * GET /api/worker/insurance-claims/:id
 * Returns full claim detail with fresh 15-min signed URLs per evidence item.
 * Ownership-checked — workers can only view their own claims.
 */
export const getInsuranceClaim = async (uid, claimId) => {
  const workerSnap = await db.collection("workers").where("userId", "==", uid).limit(1).get();
  if (workerSnap.empty) throw new ApiError(404, "Worker profile not found");
  const workerId = workerSnap.docs[0].id;

  const claimSnap = await db.collection("insuranceClaims").doc(claimId).get();
  if (!claimSnap.exists) throw new ApiError(404, "Insurance claim not found");

  const claimData = claimSnap.data();
  if (claimData.workerId !== workerId) {
    throw new ApiError(404, "Insurance claim not found"); // 404 not 403 — don't confirm existence
  }

  // Generate fresh signed URLs per evidence item (15-min expiry, never cached)
  const evidenceWithUrls = claimData.evidence.map((item) => ({
    ...item,
    signedUrl: generateSignedKYCUrl(item.cloudinaryPublicId, item.resourceType),
  }));

  return { id: claimSnap.id, ...claimData, evidence: evidenceWithUrls };
};
