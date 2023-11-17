import express from "express";
import verifyAccessToken from "../middlewares/verifyAccessToken.js";
import {
  createMessage,
  getConvoLastMessage,
  getConvoMessages,
} from "../controllers/messageController.js";

const router = express.Router();

router.post("/", verifyAccessToken, createMessage);
router.get("/:convoId", verifyAccessToken, getConvoMessages);
router.get("/last/:convoId", verifyAccessToken, getConvoLastMessage);

export default router;
