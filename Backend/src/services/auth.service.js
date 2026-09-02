import { db } from "../config/firebase.js";
import ApiError from "../utils/ApiError.js";
import { uploadToCloudinary } from "../utils/uploadToCloudinary.js";

/**
 * Complete profile registration for a new user.
 * @param {Object} user - { uid, email } from req.user
 * @param {Object} body - { name, phone, role, address }
 * @param {Object} [file] - req.file from Multer (optional photo)
 * @returns {Promise<Object>} The created/updated profile data
 */
export const completeProfileService = async (user, body = {}, file) => {
  const targetRole = (body.role || "CUSTOMER").toUpperCase();
  const name = body.name || user.email?.split("@")[0] || "Customer";
  const phone = body.phone || "+91 9999999999";
  const address = body.address || body.currentLocation || "";
  const currentLocation = body.currentLocation || body.address || "";
  const houseNo = body.houseNo || "";
  const landmark = body.landmark || "";
  const city = body.city || "";
  const pincode = body.pincode || "";

  if (!["CUSTOMER", "GIG_WORKER"].includes(targetRole)) {
    throw new ApiError(400, "Role must be either 'CUSTOMER' or 'GIG_WORKER'");
  }

  // Upload photo to Cloudinary if provided
  let photoUrl = body.photoUrl || body.avatar || null;
  if (file) {
    const folder = targetRole === "CUSTOMER" ? "sahakari/customer" : "sahakari/worker";
    photoUrl = await uploadToCloudinary(file.buffer, folder, file.mimetype);
  }

  const now = new Date().toISOString();

  if (targetRole === "CUSTOMER") {
    const customerSnap = await db.collection("customers").doc(user.uid).get();
    const existingData = customerSnap.exists ? customerSnap.data() : {};

    const fullLocation = currentLocation || address || existingData.currentLocation || existingData.address || "";
    const addressParts = fullLocation ? fullLocation.split(",").map((s) => s.trim()).filter(Boolean) : [];
    const derivedHouseNo = addressParts.length >= 2 ? addressParts[0] : (addressParts[0] || "");
    const derivedCity = addressParts.length >= 2 ? addressParts[addressParts.length - 1] : "";
    const derivedLandmark = addressParts.length >= 3 ? addressParts[1] : "";

    const customerData = {
      email: user.email || existingData.email || "",
      name: name || existingData.name || "",
      phone: phone || existingData.phone || "",
      houseNo: (houseNo && houseNo.trim()) || existingData.houseNo || derivedHouseNo || "",
      currentLocation: fullLocation,
      address: fullLocation,
      landmark: (landmark && landmark.trim()) || existingData.landmark || derivedLandmark || "",
      city: (city && city.trim()) || existingData.city || derivedCity || "",
      pincode: (pincode && pincode.trim()) || existingData.pincode || "",
      photoUrl: photoUrl || existingData.photoUrl || existingData.avatar || "",
      avatar: photoUrl || existingData.avatar || existingData.photoUrl || "",
      role: "CUSTOMER",
      updatedAt: now,
    };

    if (!customerSnap.exists || !existingData.createdAt) {
      customerData.createdAt = now;
    }

    Object.keys(customerData).forEach((key) => {
      if (customerData[key] === undefined || customerData[key] === null) {
        customerData[key] = "";
      }
    });

    await db.collection("customers").doc(user.uid).set(customerData, { merge: true });
    return { id: user.uid, role: "CUSTOMER", ...existingData, ...customerData };
  } else {
    const workerQuery = await db.collection("workers").where("userId", "==", user.uid).limit(1).get();
    let workerRef;
    let existingData = {};

    if (!workerQuery.empty) {
      const doc = workerQuery.docs[0];
      workerRef = doc.ref;
      existingData = doc.data();
    } else {
      workerRef = db.collection("workers").doc();
    }

    const workerData = {
      userId: user.uid,
      email: user.email || existingData.email || "",
      name,
      phone,
      ...(address ? { address } : {}),
      skills: existingData.skills || [],
      verificationStatus: existingData.verificationStatus || "pending",
      ...(photoUrl ? { photoUrl } : {}),
      updatedAt: now,
    };

    if (!existingData.createdAt) {
      workerData.createdAt = now;
    }

    await workerRef.set(workerData, { merge: true });
    return { id: workerRef.id, role: "GIG_WORKER", ...existingData, ...workerData };
  }
};
