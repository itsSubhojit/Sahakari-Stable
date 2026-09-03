import "dotenv/config";

// Validate environment variables immediately
import "./config/env.js";

import app from "../app.js";

import { syncAllCustomerSchemas } from "./services/customer/profile.service.js";

const PORT = process.env.PORT || 5000;

// Reload trigger: 2026-09-01T19:00:52
app.listen(PORT, async () => {
  console.log(`Server running on Port ${PORT}`);
  await syncAllCustomerSchemas();
});

// Trigger nodemon reload
