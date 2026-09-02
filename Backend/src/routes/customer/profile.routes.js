import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";
import { upload } from "../../middlewares/upload.middleware.js";
import {
  getProfile,
  updateProfile,
  uploadProfileImage,
} from "../../controllers/customer/profile.controller.js";

const router = Router();

// All customer profile routes require a valid token AND the CUSTOMER role
router.use(authenticate, authorize("CUSTOMER"));

router.get("/", getProfile);
router.patch("/", updateProfile);

// Multer (.single("image")) parses the multipart/form-data; fileFilter already
// rejects non-image/non-pdf types with a 400 before the handler runs.
router.patch("/image", upload.single("image"), uploadProfileImage);

export default router;
