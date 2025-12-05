import express from "express";
import {
    addVaccination,
    getVaccinations,
    getVaccinationById,
    updateVaccinationStatus
} from "../controllers/vaccinationController.js";
import { userAuth } from "../middleware/userAuth.js";

const router = express.Router();

// All routes require authentication
// router.use(userAuth); // This line is removed as userAuth is applied per route

// Routes
router.post("/add", userAuth, addVaccination);
router.get("/", userAuth, getVaccinations); // No userId parameter needed
router.get("/:id", userAuth, getVaccinationById);
router.patch("/:id/status", userAuth, updateVaccinationStatus);

export default router;