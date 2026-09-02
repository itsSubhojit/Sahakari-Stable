import { Router } from "express";
import { getNearbyWorkers } from "../../controllers/customer/nearby.controller.js";

const router = Router();

// Public route for nearby workers discovery (guest + customer)
router.get("/", getNearbyWorkers);

export default router;
