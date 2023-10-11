import express from "express";
import upload from "../middlewares/multer.js";
import verifyAccessToken from "../middlewares/verifyAccessToken.js";
import {
  createPost,
  getPostsByHandler,
  getPostsOfFollowedUsers,
  getUserPosts,
} from "../controllers/postController.js";

const router = express.Router();
router.get("/feed", verifyAccessToken, getPostsOfFollowedUsers);
router.post("/", verifyAccessToken, upload.array("photos"), createPost);
router.get("/userPosts", verifyAccessToken, getUserPosts);
router.get("/:userHandler", getPostsByHandler);
export default router;
