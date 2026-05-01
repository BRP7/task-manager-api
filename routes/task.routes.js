import express from "express";
import {
    createTask,
    getTaskHistory,
    getTasks,
    updateTaskStatus,
    renameTask,
    carryForwardedTask,
    deleteTask
} from "../controllers/task.controller.js";
import { auth } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", auth, createTask);
router.get("/", auth, getTasks);
router.get("/history", auth, getTaskHistory);
router.patch("/:id/status", auth, updateTaskStatus);

router.patch("/:id/rename", auth, renameTask);
router.post("/carry-forward", auth, carryForwardedTask);
router.delete("/:id", auth, deleteTask);

export default router;
