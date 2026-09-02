export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error!";
  const errors = err.errors || [];

  // Firestore/Firebase errors have a different shape (err.code, not err.statusCode)
  // Map the common ones so clients get a sensible status instead of a blind 500.
  if (err.code === "permission-denied") {
    statusCode = 403;
    message = "You do not have permission to perform this action.";
  } else if (err.code === "not-found") {
    statusCode = 404;
    message = "The requested resource was not found.";
  } else if (typeof err.code === "string" && err.code.startsWith("auth/")) {
    statusCode = 401;
    message = "Authentication failed.";
  }

  if (process.env.NODE_ENV === "development") {
    console.error(err);
  }

  return res.status(statusCode).json({
    success: false,
    message,
    ...(errors.length > 0 ? { errors } : {}),
    ...(process.env.NODE_ENV === "development" ? { stack: err.stack } : {}),
  });
};