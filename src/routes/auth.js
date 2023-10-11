import express from "express";
import verifyAccessToken from "../middlewares/verifyAccessToken.js";
import { login, logout, register } from "../controllers/authController.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", verifyAccessToken, logout);

export default router;
