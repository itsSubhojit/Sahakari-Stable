import { db } from "../../config/firebase.js";
import ApiError from "../../utils/ApiError.js";

/**
 * GET /api/admin/services
 * Returns the entire master service catalog from services collection.
 *
 * @returns {Promise<Array<Object>>} List of services
 */
export const getAdminServicesService = async () => {
  const snapshot = await db.collection("services").get();

  const services = [];
  snapshot.forEach((doc) => {
    services.push({ id: doc.id, ...doc.data() });
  });

  // Sort alphabetically by name
  services.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

  return services;
};

/**
 * POST /api/admin/services
 * Creates a new master service in the services collection. (SUPER_ADMIN only)
 *
 * @param {Object} body - { serviceId, name, category, description, basePrice, icon, isActive }
 * @returns {Promise<Object>} Created service document
 */
export const createAdminServiceService = async (body) => {
  const { serviceId, name, category, description, basePrice, icon, isActive } = body;

  if (!name || typeof name !== "string" || !name.trim()) {
    throw new ApiError(400, "Service 'name' is required");
  }

  if (!category || typeof category !== "string" || !category.trim()) {
    throw new ApiError(400, "Service 'category' is required");
  }

  if (basePrice !== undefined && basePrice !== null) {
    const numPrice = Number(basePrice);
    if (isNaN(numPrice) || numPrice < 0) {
      throw new ApiError(400, "'basePrice' must be a non-negative number");
    }
  }

  const now = new Date().toISOString();
  const slugId = serviceId && typeof serviceId === "string" && serviceId.trim()
    ? serviceId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "_")
    : null;

  let docRef;
  if (slugId) {
    docRef = db.collection("services").doc(slugId);
    const existing = await docRef.get();
    if (existing.exists) {
      throw new ApiError(409, `Service with ID '${slugId}' already exists`);
    }
  } else {
    docRef = db.collection("services").doc();
  }

  const serviceData = {
    name: name.trim(),
    category: category.trim().toLowerCase(),
    description: description && typeof description === "string" ? description.trim() : "",
    basePrice: basePrice !== undefined && basePrice !== null ? Number(basePrice) : 0,
    icon: icon && typeof icon === "string" ? icon.trim() : "",
    isActive: isActive !== false,
    createdAt: now,
    updatedAt: now,
  };

  await docRef.set(serviceData);

  return { id: docRef.id, ...serviceData };
};

/**
 * PATCH /api/admin/services/:id
 * Partial update of an existing master service document. (SUPER_ADMIN only)
 *
 * @param {string} serviceId
 * @param {Object} body - { name, category, description, basePrice, icon, isActive }
 * @returns {Promise<Object>} Updated service document
 */
export const updateAdminServiceService = async (serviceId, body) => {
  if (!serviceId) {
    throw new ApiError(400, "Service ID is required");
  }

  const docRef = db.collection("services").doc(serviceId);
  const snap = await docRef.get();

  if (!snap.exists) {
    throw new ApiError(404, "Service not found");
  }

  const { name, category, description, basePrice, icon, isActive } = body;
  const updates = {};

  if (name !== undefined) {
    if (typeof name !== "string" || !name.trim()) {
      throw new ApiError(400, "'name' must be a non-empty string");
    }
    updates.name = name.trim();
  }

  if (category !== undefined) {
    if (typeof category !== "string" || !category.trim()) {
      throw new ApiError(400, "'category' must be a non-empty string");
    }
    updates.category = category.trim().toLowerCase();
  }

  if (description !== undefined) {
    updates.description = typeof description === "string" ? description.trim() : "";
  }

  if (basePrice !== undefined) {
    const numPrice = Number(basePrice);
    if (isNaN(numPrice) || numPrice < 0) {
      throw new ApiError(400, "'basePrice' must be a non-negative number");
    }
    updates.basePrice = numPrice;
  }

  if (icon !== undefined) {
    updates.icon = typeof icon === "string" ? icon.trim() : "";
  }

  if (isActive !== undefined) {
    updates.isActive = Boolean(isActive);
  }

  if (Object.keys(updates).length === 0) {
    throw new ApiError(400, "No valid fields provided for update");
  }

  updates.updatedAt = new Date().toISOString();

  await docRef.update(updates);

  const updatedSnap = await docRef.get();
  return { id: updatedSnap.id, ...updatedSnap.data() };
};
