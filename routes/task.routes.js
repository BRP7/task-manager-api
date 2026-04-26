import express from "express";
import { createTask, updateTaskStatus } from "../controllers/task.controller.js";
import { auth } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", auth, createTask);
router.patch("/:id/status", auth, updateTaskStatus);

export default router;