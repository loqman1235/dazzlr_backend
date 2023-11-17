import express from "express";
import verifyAccessToken from "../middlewares/verifyAccessToken.js";
import {
  createConvo,
  findUserConvo,
  findUserConvos,
} from "../controllers/convoController.js";

const router = express.Router();

router.post("/", verifyAccessToken, createConvo);
router.get("/", verifyAccessToken, findUserConvos);
router.get("/:convoId", verifyAccessToken, findUserConvo);

export default router;
