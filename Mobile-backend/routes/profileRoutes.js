import express from "express";
import { getProfile } from "../controllers/profileController.js";
import { userAuth } from "../middleware/userAuth.js";

const router = express.Router();

router.get("/", userAuth, getProfile);

export default router;
