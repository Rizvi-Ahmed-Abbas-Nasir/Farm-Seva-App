import express from "express";
import { getFarmers } from "../controllers/farmerController.js";
import { adminAuth } from "../middleware/adminAuth.js";

const router = express.Router();

router.get("/", adminAuth, getFarmers);

export default router;
