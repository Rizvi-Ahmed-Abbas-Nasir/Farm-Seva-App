import express from "express";
import { userAuth } from "../middleware/userAuth.js";
import {
    generateVaccinationSchedule,
    generateCheckupSchedule,
    getScheduleRecommendations
} from "../controllers/scheduleController.js";

const router = express.Router();

// All routes require authentication
router.use(userAuth);

// Generate vaccination schedule
router.post("/vaccination/generate", generateVaccinationSchedule);

// Generate checkup schedule
router.post("/checkup/generate", generateCheckupSchedule);

// Get schedule recommendations
router.get("/recommendations", getScheduleRecommendations);

export default router;
