import express from "express";
import { login } from "../controllers/authController.js";

const router = express.Router();

// Admin uses same login but must have admin role
router.post("/login", login);

export default router;
