import express from "express";
import { chat } from "../controllers/chatController.js";
import { userAuth } from "../middleware/userAuth.js";

const router = express.Router();

// Chat endpoint
router.post("/", userAuth, chat);

export default router;

