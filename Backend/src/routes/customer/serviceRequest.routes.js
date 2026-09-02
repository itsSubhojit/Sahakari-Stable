import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";
import {
  createServiceRequest,
  getServiceRequestById,
  getServiceRequestNegotiations,
} from "../../controllers/customer/serviceRequest.controller.js";

import { openNegotiation } from "../../controllers/worker/request.controller.js";

const router = Router();

// Customer endpoints
router.post("/", authenticate, authorize("CUSTOMER"), createServiceRequest);
router.get("/:id", authenticate, authorize("CUSTOMER"), getServiceRequestById);
router.get("/:id/negotiations", authenticate, authorize("CUSTOMER"), getServiceRequestNegotiations);

// Worker endpoint: open a new negotiation thread on a service request
router.post("/:id/negotiations", authenticate, authorize("GIG_WORKER"), openNegotiation);

export default router;
