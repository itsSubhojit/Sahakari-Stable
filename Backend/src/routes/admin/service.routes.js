import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";
import {
  getAdminServices,
  createAdminService,
  updateAdminService,
} from "../../controllers/admin/service.controller.js";

const router = Router();

// All service administration routes require authentication
router.use(authenticate);

// GET is accessible by COOPERATIVE_ADMIN & SUPER_ADMIN
router.get("/", authorize("COOPERATIVE_ADMIN", "SUPER_ADMIN"), getAdminServices);

// POST and PATCH mutation operations are restricted strictly to SUPER_ADMIN
router.post("/", authorize("SUPER_ADMIN"), createAdminService);
router.patch("/:id", authorize("SUPER_ADMIN"), updateAdminService);

export default router;
