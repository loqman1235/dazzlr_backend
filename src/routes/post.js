import express from "express";
import upload from "../middlewares/multer.js";
import verifyAccessToken from "../middlewares/verifyAccessToken.js";
import {
  createPost,
  getPostById,
  getReplyParentPosts,
  getPostReplies,
  getPostsByHandler,
  getPostsOfFollowedUsers,
  getUserPosts,
  isPostLikedByLoggedInUser,
  likePost,
} from "../controllers/postController.js";

const router = express.Router();
router.get("/feed", verifyAccessToken, getPostsOfFollowedUsers);
router.get("/replies/:postId", getPostReplies);
router.get("/parents/:postId", getReplyParentPosts);
router.get("/post/:postId", getPostById);
router.post("/", verifyAccessToken, upload.array("photos"), createPost);
router.get("/userPosts", verifyAccessToken, getUserPosts);
router.get("/:userHandler", getPostsByHandler);

// Like posts
router.post("/like/:postId", verifyAccessToken, likePost);
router.post(
  "/is-post-liked/:postId",
  verifyAccessToken,
  isPostLikedByLoggedInUser
);

export default router;
