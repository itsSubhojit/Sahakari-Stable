import { db } from "../config/firebase.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

export const authorize = (...allowedRoles) => {
  return asyncHandler(async (req, res, next) => {
    if (!req.user || !req.user.uid) {
      throw new ApiError(401, "Authentication required");
    }

    const uid = req.user.uid;
    let resolvedRole = null;

    // 1. Check customers/{uid} doc
    const customerDoc = await db.collection("customers").doc(uid).get();
    if (customerDoc.exists) {
      resolvedRole = "CUSTOMER";
    } else {
      // 2. Check workers collection where userId == uid
      const workerQuery = await db.collection("workers").where("userId", "==", uid).limit(1).get();
      if (!workerQuery.empty) {
        resolvedRole = "GIG_WORKER";
      } else {
        // 3. Check admins/{uid} doc
        const adminDoc = await db.collection("admins").doc(uid).get();
        if (adminDoc.exists) {
          const adminData = adminDoc.data();
          resolvedRole = adminData?.role; // Expected: "COOPERATIVE_ADMIN" or "SUPER_ADMIN"
        }
      }
    }

    // Auto-provision Customer document if authenticated user accesses customer resource
    if (!resolvedRole) {
      if (allowedRoles.includes("CUSTOMER")) {
        const now = new Date().toISOString();
        const defaultCustomer = {
          email: req.user.email || "",
          name: req.user.email ? req.user.email.split("@")[0] : "Customer",
          phone: "+91 9999999999",
          houseNo: "",
          currentLocation: "",
          address: "",
          landmark: "",
          city: "",
          pincode: "",
          photoUrl: "",
          avatar: "",
          role: "CUSTOMER",
          createdAt: now,
          updatedAt: now,
        };
        await db.collection("customers").doc(uid).set(defaultCustomer, { merge: true });
        resolvedRole = "CUSTOMER";
      } else {
        throw new ApiError(403, "Access denied: User role could not be determined");
      }
    }

    if (!allowedRoles.includes(resolvedRole)) {
      throw new ApiError(403, `Access denied: Role '${resolvedRole}' is not authorized for this resource`);
    }

    req.user.role = resolvedRole;
    next();
  });
};
