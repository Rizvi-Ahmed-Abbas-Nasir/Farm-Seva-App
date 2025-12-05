import express from "express";
import {
    addCheckup,
    getCheckups,
    getCheckupById,
    updateCheckupStatus
} from "../controllers/checkupController.js";
import { userAuth } from "../middleware/userAuth.js";

const router = express.Router();

// Routes
router.post("/add", userAuth, addCheckup);
router.get("/", userAuth, getCheckups);
router.get("/:id", userAuth, getCheckupById);
router.patch("/:id/status", userAuth, updateCheckupStatus);

export default router;
