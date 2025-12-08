import express from "express";
import {
    addTask,
    getTasks,
    getTaskById,
    toggleTaskComplete,
    updateTask,
    deleteTask
} from "../controllers/taskController.js";
import { userAuth } from "../middleware/userAuth.js";

const router = express.Router();

// All routes require authentication
// Routes
router.post("/", userAuth, addTask);
router.get("/", userAuth, getTasks);
router.get("/:id", userAuth, getTaskById);
router.patch("/:id/toggle", userAuth, toggleTaskComplete);
router.put("/:id", userAuth, updateTask);
router.delete("/:id", userAuth, deleteTask);

export default router;

