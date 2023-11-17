import express from "express";
import upload from "../middlewares/multer.js";
import verifyAccessToken from "../middlewares/verifyAccessToken.js";
import {
  followUser,
  getAllUsers,
  getLoggedInUser,
  getUserByHandler,
  isUserAlreadyFollowed,
  unfollowUser,
  updateUser,
} from "../controllers/userController.js";

const router = express.Router();
router.get("/:userHandler", getUserByHandler);
router.get("/getLoggedInUser", getLoggedInUser);

router.get("/", getAllUsers);
// Update user
router.put(
  "/",
  verifyAccessToken,
  upload.fields([{ name: "avatar" }, { name: "cover" }]),
  updateUser
);

// Following route
router.post("/follow/:followedUserId", verifyAccessToken, followUser);
router.post("/unfollow/:followedUserId", verifyAccessToken, unfollowUser);
router.post(
  "/is-user-followed/:userIdToBeChecked",
  verifyAccessToken,
  isUserAlreadyFollowed
);

export default router;
