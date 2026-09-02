import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUD_NAME || "dbxzt4ygc",
  api_key: process.env.CLOUDINARY_API_KEY || process.env.CLOUD_API_KEY || "731258151126769",
  api_secret: process.env.CLOUDINARY_API_SECRET || process.env.CLOUD_API_SECRET || "u8On7Pm5eJr0vFL15QhuCe50Qvs",
});

export default cloudinary;
