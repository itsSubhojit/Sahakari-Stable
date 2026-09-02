import { Router } from "express";
import { getServices, getServiceDetails } from "../../controllers/customer/service.controller.js";

const router = Router();

router.get("/", getServices);
router.get("/:serviceId", getServiceDetails);

export default router;
