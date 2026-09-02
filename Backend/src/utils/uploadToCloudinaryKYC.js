import cloudinary from "../config/cloudinary.js";
import ApiError from "./ApiError.js";

/**
 * Upload a worker KYC document to Cloudinary using "authenticated" delivery type.
 * @param {Buffer} fileBuffer - Multer file buffer
 * @param {string} mimeType - File MIME type (e.g., application/pdf, image/png)
 * @param {string} publicIdName - File public_id name
 * @returns {Promise<{ publicId: string, resourceType: string, format: string }>}
 */
export const uploadToCloudinaryKYC = (fileBuffer, mimeType, publicIdName) => {
  return new Promise((resolve, reject) => {
    const isPdf = mimeType === "application/pdf";
    const resourceType = isPdf ? "raw" : "image";

    const uploadOptions = {
      folder: "sahakari/worker/documents",
      public_id: publicIdName,
      resource_type: resourceType,
      type: "authenticated", // Restricts public URL access
      overwrite: false,
    };

    const stream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          return reject(
            new ApiError(
              500,
              `Cloudinary KYC upload failed: ${error.message || "Upload error"}`
            )
          );
        }
        resolve({
          publicId: result.public_id,
          resourceType: result.resource_type,
          format: result.format || (isPdf ? "pdf" : ""),
        });
      }
    );

    stream.end(fileBuffer);
  });
};

/**
 * Generate a fresh 15-minute signed URL for an authenticated Cloudinary KYC resource.
 * @param {string} publicId - Permanent Cloudinary public_id
 * @param {string} resourceType - "image" or "raw"
 * @returns {string} Fresh signed URL valid for 15 minutes
 */
export const generateSignedKYCUrl = (publicId, resourceType) => {
  const expiresAt = Math.floor(Date.now() / 1000) + 15 * 60; // 15 minutes Unix timestamp
  return cloudinary.url(publicId, {
    resource_type: resourceType,
    type: "authenticated",
    sign_url: true,
    expires_at: expiresAt,
    secure: true,
  });
};

/**
 * Generate a plain unsigned URL (without cryptographic signature) for negative security testing.
 * @param {string} publicId
 * @param {string} resourceType
 * @returns {string} Plain unsigned URL
 */
export const generatePlainUnsignedKYCUrl = (publicId, resourceType) => {
  return cloudinary.url(publicId, {
    resource_type: resourceType,
    type: "authenticated",
    sign_url: false, // NO SIGNATURE
    secure: true,
  });
};
