import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";
import { upload } from "../../middlewares/upload.middleware.js";
import {
  uploadDocument,
  getDocuments,
  getDocumentById,
} from "../../controllers/worker/document.controller.js";

const router = Router();

// Protect all worker document endpoints with authentication and GIG_WORKER role
router.use(authenticate, authorize("GIG_WORKER"));

router.post("/", upload.single("document"), uploadDocument);
router.get("/", getDocuments);
router.get("/:id", getDocumentById);

export default router;
