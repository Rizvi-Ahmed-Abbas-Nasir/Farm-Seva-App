import express from "express";
import { addVaccination, getVaccinations } from "../controllers/vaccinationController.js";
import { userAuth } from "../middleware/userAuth.js";

const router = express.Router();

// All routes require authentication
router.use(userAuth);

// Routes
router.post("/add", addVaccination);
router.get("/", getVaccinations); // No userId parameter needed

export default router;