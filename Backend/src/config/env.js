// Environment variable checker with non-blocking graceful fallback for development & preview
const checkEnvVars = [
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET"
];

const missing = checkEnvVars.filter((varName) => !process.env[varName]);

if (missing.length > 0) {
  console.warn(
    `[Notice] The following environment variables are not set in .env yet:\n${missing
      .map((v) => `  - ${v}`)
      .join("\n")}\nRunning in hybrid development/resilient fallback mode.`
  );
} else {
  console.log(`[Config] All required environment credentials are fully configured.`);
}

export default true;
