import { db } from "../../config/firebase.js";
import ApiError from "../../utils/ApiError.js";

// Fields a customer is allowed to update in Firestore
const ALLOWED_UPDATE_FIELDS = [
  "name",
  "email",
  "phone",
  "address",
  "currentLocation",
  "photoUrl",
  "avatar",
  "dateOfBirth",
  "gender",
  "city",
  "landmark",
  "pincode",
  "houseNo",
];

/**
 * Ensures a customer object has all required fields populated with default values.
 * Parses full address/location to automatically infer houseNo, city, and landmark if missing.
 */
export const normalizeCustomerDoc = (data = {}) => {
  const photo = data.photoUrl || data.avatar || "";
  const location = data.currentLocation || data.address || "";

  // Intelligent fallback extraction from location address string
  const addressParts = location ? location.split(",").map((s) => s.trim()).filter(Boolean) : [];
  const derivedHouseNo = addressParts.length >= 2 ? addressParts[0] : (addressParts[0] || "");
  const derivedCity = addressParts.length >= 2 ? addressParts[addressParts.length - 1] : "";
  const derivedLandmark = addressParts.length >= 3 ? addressParts[1] : "";

  return {
    name: data.name || "",
    email: data.email || "",
    phone: data.phone || "",
    houseNo: (data.houseNo && data.houseNo.trim()) || derivedHouseNo || "",
    currentLocation: location,
    address: location,
    landmark: (data.landmark && data.landmark.trim()) || derivedLandmark || "",
    city: (data.city && data.city.trim()) || derivedCity || "",
    pincode: (data.pincode && data.pincode.trim()) || "",
    photoUrl: photo,
    avatar: photo,
    role: data.role || "CUSTOMER",
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString(),
  };
};

/**
 * Fetch the customers/{uid} document.
 * @param {string} uid
 * @returns {Promise<Object>} Customer data with id attached
 */
export const getCustomerProfile = async (uid) => {
  const docRef = db.collection("customers").doc(uid);
  const snap = await docRef.get();

  if (!snap.exists) {
    const defaultData = normalizeCustomerDoc({});
    return { id: uid, ...defaultData };
  }

  const data = snap.data() || {};
  return {
    id: snap.id,
    ...data,
    ...normalizeCustomerDoc(data),
  };
};

/**
 * Update allowed fields of customers/{uid}.
 * Ensures ALL schema fields (houseNo, currentLocation, address, landmark, city, pincode, photoUrl, avatar, etc.)
 * are explicitly persisted to the Firestore document without dropping or zeroing out existing data.
 * 
 * @param {string} uid
 * @param {Object} body - Raw request body
 * @returns {Promise<Object>} Updated customer data
 */
export const updateCustomerProfile = async (uid, body) => {
  const docRef = db.collection("customers").doc(uid);
  const snap = await docRef.get();
  const existing = snap.exists ? snap.data() : {};

  const name = (body.name && String(body.name).trim()) || existing.name || "";
  const email = (body.email && String(body.email).trim()) || existing.email || "";
  const phone = (body.phone && String(body.phone).trim()) || existing.phone || "";

  const currentLocation =
    (body.currentLocation && String(body.currentLocation).trim()) ||
    (body.address && String(body.address).trim()) ||
    existing.currentLocation ||
    existing.address ||
    "";
  const address = currentLocation;

  // Address parts parsing fallback
  const addressParts = currentLocation ? currentLocation.split(",").map((s) => s.trim()).filter(Boolean) : [];
  const derivedHouseNo = addressParts.length >= 2 ? addressParts[0] : (addressParts[0] || "");
  const derivedCity = addressParts.length >= 2 ? addressParts[addressParts.length - 1] : "";
  const derivedLandmark = addressParts.length >= 3 ? addressParts[1] : "";

  const houseNo =
    (body.houseNo && String(body.houseNo).trim()) ||
    existing.houseNo ||
    derivedHouseNo ||
    "";
  const landmark =
    (body.landmark && String(body.landmark).trim()) ||
    existing.landmark ||
    derivedLandmark ||
    "";
  const city =
    (body.city && String(body.city).trim()) ||
    existing.city ||
    derivedCity ||
    "";
  const pincode =
    (body.pincode && String(body.pincode).trim()) ||
    existing.pincode ||
    "";

  const photoUrl =
    (body.photoUrl && String(body.photoUrl).trim()) ||
    (body.avatar && String(body.avatar).trim()) ||
    existing.photoUrl ||
    existing.avatar ||
    "";
  const avatar = photoUrl;

  const updates = {
    name,
    email,
    phone,
    houseNo,
    currentLocation,
    address,
    landmark,
    city,
    pincode,
    photoUrl,
    avatar,
    role: "CUSTOMER",
    updatedAt: new Date().toISOString(),
  };

  if (!existing.createdAt) {
    updates.createdAt = new Date().toISOString();
  }

  // Ensure no undefined or null values exist in the updates payload for Firestore
  Object.keys(updates).forEach((key) => {
    if (updates[key] === undefined || updates[key] === null) {
      updates[key] = "";
    }
  });

  await docRef.set(updates, { merge: true });

  const updated = await docRef.get();
  return { id: updated.id, ...updated.data() };
};

/**
 * Utility to backfill any missing schema fields on all customer documents in Firestore.
 */
export const syncAllCustomerSchemas = async () => {
  try {
    const snapshot = await db.collection("customers").get();
    if (snapshot.empty) return;

    const batch = db.batch();
    let count = 0;

    snapshot.forEach((doc) => {
      const data = doc.data();
      const normalized = normalizeCustomerDoc(data);

      // Check if any field is missing or empty when a derived value exists
      const needsUpdate = Object.keys(normalized).some(
        (key) => data[key] === undefined || (data[key] === "" && normalized[key] !== "")
      );
      if (needsUpdate) {
        batch.set(doc.ref, normalized, { merge: true });
        count++;
      }
    });

    if (count > 0) {
      await batch.commit();
      console.log(`[Schema Migration] Backfilled missing profile fields for ${count} customer documents.`);
    }
  } catch (err) {
    console.warn(`[Schema Migration Warning] ${err.message}`);
  }
};

/**
 * Upload a profile image to Cloudinary (sahakari/customer folder)
 * and persist the returned secure_url to customers/{uid}.photoUrl and avatar.
 *
 * @param {string} uid
 * @param {Buffer} fileBuffer - Multer in-memory buffer
 * @returns {Promise<Object>} Updated customer document
 */
export const updateCustomerProfileImageService = async (uid, fileBuffer) => {
  const docRef = db.collection("customers").doc(uid);

  const { uploadToCloudinary } = await import("../../utils/uploadToCloudinary.js");
  const photoUrl = await uploadToCloudinary(fileBuffer, "sahakari/customer");

  const now = new Date().toISOString();
  await docRef.set({ photoUrl, avatar: photoUrl, role: "CUSTOMER", updatedAt: now }, { merge: true });

  const updatedSnap = await docRef.get();
  return { id: updatedSnap.id, ...updatedSnap.data() };
};
