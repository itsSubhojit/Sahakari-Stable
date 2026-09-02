import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";
import {
  getAdminCooperatives,
  createAdminCooperative,
  getAdminCooperativeById,
} from "../../controllers/admin/cooperative.controller.js";

const router = Router();

// All cooperative routes require valid authentication
router.use(authenticate);

// GET routes accessible by COOPERATIVE_ADMIN & SUPER_ADMIN
router.get("/", authorize("COOPERATIVE_ADMIN", "SUPER_ADMIN"), getAdminCooperatives);
router.get("/:id", authorize("COOPERATIVE_ADMIN", "SUPER_ADMIN"), getAdminCooperativeById);

// POST creation restricted strictly to SUPER_ADMIN
router.post("/", authorize("SUPER_ADMIN"), createAdminCooperative);

export default router;
