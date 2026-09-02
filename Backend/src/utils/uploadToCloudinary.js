import cloudinary from "../config/cloudinary.js";

/**
 * Uploads a file buffer to Cloudinary using a stream with resource_type: "image".
 * @param {Buffer} fileBuffer - The file buffer from Multer.
 * @param {string} folder - The destination folder (e.g., "sahakari/customer").
 * @returns {Promise<string>} The secure URL of the uploaded file.
 */
export const uploadToCloudinary = (fileBuffer, folder) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result.secure_url);
      }
    );
    uploadStream.end(fileBuffer);
  });
};
