import express from "express";
import verifyAccessToken from "../middlewares/verifyAccessToken.js";
import { createReply, getPostReplies } from "../controllers/replyController.js";

const router = express.Router();

router.post("/:postId", verifyAccessToken, createReply);
router.get("/:postId", verifyAccessToken, getPostReplies);

export default router;
