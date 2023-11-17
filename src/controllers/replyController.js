import { validationResult } from "express-validator";
import replyValidationRules from "../validators/relplyValidator.js";
import sanitizeInput from "../helpers/sanitizeInput.js";
import Reply from "../models/Reply.js";
import User from "../models/User.js";

export const createReply = async (req, res) => {
  try {
    const { userId } = req.user;
    const { postId } = req.params;
    const { replyContent } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "User Id is required" });
    }

    if (!postId) {
      return res.status(400).json({ error: "Post Id is required" });
    }

    await Promise.all(replyValidationRules.map((rule) => rule.run(req)));
    const replyValidationErrors = validationResult(req);

    if (!replyValidationErrors.isEmpty()) {
      return res.status(400).json({ errors: replyValidationErrors.array() });
    }

    const sanitizedReply = sanitizeInput(replyContent);

    // Add 5 points each time user create a post
    const user = await User.findById(userId);
    if (user) {
      user.points += 5;
      await user.save();
    }

    const createdReply = await Reply.create({
      user: userId,
      post: postId,
      reply: sanitizedReply,
      parentReply: null,
    });

    res.status(200).json({
      success: true,
      message: "Reply successfully created",
      reply: createdReply,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json(`Error creating reply ${error.message}`);
  }
};

export const getPostReplies = async (req, res) => {
  try {
    const { postId } = req.params;
    if (!postId) {
      return res.status(400).json({ error: "Post Id is required" });
    }

    const replies = await Reply.find({ post: postId })
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: "fullname userHandler avatar isVerified points accountType",
      });

    if (replies.length === 0) {
      return res.status(404).json({ error: "Post has no replies yet" });
    }

    const repliesWithoutPostId = replies.map((reply) => {
      const { post, ...rest } = reply.toObject();
      return rest;
    });

    res.status(200).json({ replies: repliesWithoutPostId });
  } catch (error) {
    console.error(error);
    res.status(500).json(`Error fetching post replies ${error.message}`);
  }
};
