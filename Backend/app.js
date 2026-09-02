import express from "express";
import cors from "cors";
import { errorHandler } from "./src/middlewares/errorHandler.js";
import customerRoutes from "./src/routes/customer/index.js";
import authRoutes from "./src/routes/auth.routes.js";
import serviceRoutes from "./src/routes/customer/service.routes.js";
import serviceRequestRoutes from "./src/routes/customer/serviceRequest.routes.js";
import negotiationRoutes from "./src/routes/customer/negotiation.routes.js";
import globalBookingRoutes from "./src/routes/customer/globalBooking.routes.js";
import paymentRoutes from "./src/routes/customer/payment.routes.js";
import reviewRoutes from "./src/routes/customer/review.routes.js";
import workerRoutes from "./src/routes/worker/index.js";
import bookingRoutes from "./src/routes/worker/booking.routes.js";
import adminRoutes from "./src/routes/admin/index.js";

const app = express();

app.use(cors({ 
  origin: process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',').map(s => s.trim()) 
    : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:3001', 'http://localhost:5174', 'http://127.0.0.1:5173'],
  credentials: true 
}));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true, message: "SIH 26089 Backend is running" });
});

// Auth module routes
app.use("/api/auth", authRoutes);

// Services routes
app.use("/api/services", serviceRoutes);

// Service Requests, Negotiations, Shared Bookings, Payments & Reviews routes
app.use("/api/service-requests", serviceRequestRoutes);
app.use("/api/negotiations", negotiationRoutes);
// Shared Bookings router (Customer/General): GET /api/bookings/:id, POST /api/bookings/:id/cancel
app.use("/api/bookings", globalBookingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/reviews", reviewRoutes);

// Customer module routes
app.use("/api/customer", customerRoutes);

// Worker module routes
app.use("/api/worker", workerRoutes);

// Shared Bookings router (Worker lifecycle & reviews): PATCH /api/bookings/:id/status, POST /api/bookings/:id/reviews
// No route collision with globalBookingRoutes above (different HTTP methods/sub-paths)
app.use("/api/bookings", bookingRoutes);

// Admin module routes
app.use("/api/admin", adminRoutes);

// Error handler LAST, always:
app.use(errorHandler);

// Force nodemon reload trigger: 2026-09-03T01:00:00
export default app;