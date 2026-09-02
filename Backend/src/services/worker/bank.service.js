import { db } from "../../config/firebase.js";
import ApiError from "../../utils/ApiError.js";

// Standard IFSC: 4 uppercase alpha chars, literal "0", then 6 alphanumeric
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;
// Account number: 9–18 digits only
const ACCOUNT_NUMBER_REGEX = /^\d{9,18}$/;

/**
 * Updates (or creates) the bank details for a verified worker.
 * Stored in workerBankDetails/{workerId}, separate from the main workers doc.
 *
 * @param {string} uid - Firebase Auth UID
 * @param {Object} payload - { accountHolderName, accountNumber, ifscCode }
 */
export const updateWorkerBankDetailsService = async (uid, payload) => {
  const { accountHolderName, accountNumber, ifscCode } = payload;

  // ── Format Validation ────────────────────────────────────────────────────
  if (!accountHolderName || typeof accountHolderName !== "string" || !accountHolderName.trim()) {
    throw new ApiError(400, "accountHolderName is required");
  }

  if (!accountNumber || !ACCOUNT_NUMBER_REGEX.test(accountNumber)) {
    throw new ApiError(
      400,
      "accountNumber must be numeric and between 9 and 18 digits"
    );
  }

  if (!ifscCode || !IFSC_REGEX.test(ifscCode)) {
    throw new ApiError(
      400,
      "ifscCode must be a valid 11-character IFSC code (e.g. SBIN0001234)"
    );
  }

  // ── Resolve Worker Doc ────────────────────────────────────────────────────
  const workerSnap = await db
    .collection("workers")
    .where("userId", "==", uid)
    .limit(1)
    .get();

  if (workerSnap.empty) {
    throw new ApiError(404, "Worker profile not found");
  }

  const workerDoc = workerSnap.docs[0];
  const workerId = workerDoc.id;
  const workerData = workerDoc.data();

  // ── Verification Gate (403, not 400) ──────────────────────────────────────
  if (workerData.verificationStatus !== "verified") {
    throw new ApiError(
      403,
      "You must be verified before submitting bank details. Your profile is currently: " +
        (workerData.verificationStatus || "unknown")
    );
  }

  // ── Upsert workerBankDetails/{workerId} ───────────────────────────────────
  const bankDetailsRef = db.collection("workerBankDetails").doc(workerId);
  const now = new Date().toISOString();

  await bankDetailsRef.set(
    {
      accountHolderName: accountHolderName.trim(),
      accountNumber,
      ifscCode,
      updatedAt: now,
    },
    { merge: true }
  );

  // Return with masked account number — safe for API response
  return {
    workerId,
    accountHolderName: accountHolderName.trim(),
    accountNumber: accountNumber.replace(/\d(?=\d{4})/g, "*"),
    ifscCode,
    updatedAt: now,
  };
};
