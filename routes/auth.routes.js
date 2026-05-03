import express from "express";
import { registerUser ,loginUser ,logoutUser ,refreshAccessToken} from "../controllers/auth.controller.js";
import { auth } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/logout", auth, logoutUser);
router.post("/login", loginUser);
router.post("/register", registerUser);
router.post("/refresh-token", refreshAccessToken);

export default router;
