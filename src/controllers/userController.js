import User from "../models/User.js";
import sanitizeInput from "../helpers/sanitizeInput.js";
import { body, validationResult } from "express-validator";
import cloudinary from "../utils/cloudinary.js";

const updateUserValidationRules = [
  body("fullname")
    .notEmpty()
    .trim()
    .custom((val, { req }) => {
      return sanitizeInput(val);
    })
    .withMessage("Display name can't be empty"),
  body("bio")
    .optional()
    .trim()
    .custom((val, { req }) => {
      if (val.length > 200) {
        throw new Error("Post content must be max of 200 characters");
      }
      return true;
    }),
  body("website").optional().trim(),
];
export const getUserByHandler = async (req, res) => {
  try {
    const { userHandler } = req.params;

    if (!userHandler) {
      return res.status(400).json({ error: "User handler is required" });
    }

    const user = await User.findOne({ userHandler })
      .populate("posts")
      .populate(
        "following",
        "avatar fullname userHandler isVerified accountType"
      )
      .populate(
        "followers",
        "avatar fullname userHandler isVerified accountType"
      );

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const { password, ipAddress, ...userWithoutPassAndIp } = user.toObject();

    res.status(200).json({
      success: true,
      message: "User successfully fetched",
      user: userWithoutPassAndIp,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json(`Error fetching user: ${error}`);
  }
};

export const getLoggedInUser = async (req, res) => {
  try {
    const { userId } = req.user;
    if (!userId) {
      return res.status(400).json({ error: "Logged in user Id is required" });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const { ipAddress, password, ...userWithoutPassAndIp } = user.toObject();

    res.status(200).json({ user: userWithoutPassAndIp });
  } catch (error) {
    console.error(error);
    res.status(500).json(`Error fetching logged in user: ${error}`);
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().populate("posts");

    if (users.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Users not found" });
    }

    const usersWithoutPassAndIp = users.map((user) => {
      const { password, ipAddress, ...userWithoutPassAndIp } = user.toObject();
      return userWithoutPassAndIp;
    });

    res.status(200).json({
      success: true,
      message: "Users successfully fetched",
      users: usersWithoutPassAndIp,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json(`Error fetching users: ${error}`);
  }
};

// Update user
export const updateUser = async (req, res) => {
  try {
    const { fullname, bio, userLocation, website } = req.body;
    const { userId } = req.user;

    await Promise.all(updateUserValidationRules.map((rule) => rule.run(req)));
    const validationErrors = validationResult(req);

    if (!validationErrors.isEmpty()) {
      return res.status(400).json({ errors: validationErrors.array() });
    }

    // Sanitized inputs
    const sanitizedFullname = DOMPurify.sanitize(fullname);
    const sanitizedBio = DOMPurify.sanitize(bio);
    const sanitizeWebsite = DOMPurify.sanitize(website);
    const sanitizeUserLocation = DOMPurify.sanitize(userLocation);

    let avatarResult;
    let coverResult;
    const user = await User.findById(userId);

    // If the user changes avatar
    if (req.files.avatar) {
      // Remove previous avatar from cloudinary
      if (user.avatar.public_id) {
        await cloudinary.uploader.destroy(user.avatar.public_id);
      }
      avatarResult = await cloudinary.uploader.upload(
        req.files.avatar[0].path,
        { folder: "dazzlr/avatars" }
      );
    }

    if (req.files.cover) {
      // Remove previous cover from cloudinary
      if (user.cover.public_id) {
        await cloudinary.uploader.destroy(user.cover.public_id);
      }
      coverResult = await cloudinary.uploader.upload(req.files.cover[0].path, {
        folder: "dazzlr/covers",
      });
    }

    const updateObject = {
      fullname: sanitizedFullname,
      bio: sanitizedBio,
      userLocation: sanitizeUserLocation,
      website: sanitizeWebsite,
    };
    if (avatarResult) {
      updateObject.avatar = {
        public_id: avatarResult?.public_id,
        url: avatarResult?.secure_url,
      };
    }

    if (coverResult) {
      updateObject.cover = {
        public_id: coverResult?.public_id,
        url: coverResult?.secure_url,
      };
    }
    const updatedUser = await User.findByIdAndUpdate(userId, updateObject, {
      new: true,
    });

    const { password, ipAddress, ...updatedUserWithoutSensetiveData } =
      updatedUser.toObject();

    res.status(200).json({
      success: true,
      message: "Your profile has been successfully saved!",
      user: updatedUserWithoutSensetiveData,
    });

    // console.log(req.files.avatar[0].path);
  } catch (error) {
    console.error(error);
    res.status(500).json(`Error updating user ${error.message}`);
  }
};

// Following
export const followUser = async (req, res) => {
  try {
    // User Id of the account to be followed
    const { followedUserId } = req.params;

    if (!followedUserId) {
      return res
        .status(400)
        .json({ error: "The ID of the followed user is required" });
    }

    const { userId } = req.user;

    if (!userId) {
      return res.status(400).json({ error: "The user ID is required" });
    }

    if (followedUserId === userId) {
      return res.status(400).json({ error: "You can't follow yourself!" });
    }

    // Find the logged-in user by their ID and update their following list
    const loggedInUser = await User.findById(userId);
    const followedUser = await User.findById(followedUserId);

    if (!loggedInUser) {
      return res.status(404).json({ error: "Logged-in user not found" });
    }

    if (!followedUser) {
      return res.status(404).json({ error: "Followed user not found" });
    }

    // Check if the user is already following the target user
    if (loggedInUser.following.includes(followedUserId)) {
      return res
        .status(400)
        .json({ error: "You are already following this user" });
    }

    loggedInUser.following.push(followedUserId);
    await loggedInUser.save();
    followedUser.followers.push(userId);
    await followedUser.save();

    res.status(200).json({ success: true, message: "User has been followed" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: `Error following user: ${error.message}` });
  }
};

export const unfollowUser = async (req, res) => {
  try {
    const { userId } = req.user;
    const { followedUserId } = req.params;

    if (!followedUserId) {
      return res
        .status(400)
        .json({ error: "The ID of the followed user is required" });
    }

    if (!userId) {
      return res.status(400).json({ error: "The user ID is required" });
    }

    const loggedInUser = await User.findById(userId);
    const followedUser = await User.findById(followedUserId);

    if (!loggedInUser) {
      return res.status(404).json({ error: "Logged-in user not found" });
    }

    if (!followedUser) {
      return res.status(404).json({ error: "Followed user not found" });
    }

    if (!loggedInUser.following.includes(followedUserId)) {
      return res
        .status(400)
        .json({ error: "You are not currently following this user" });
    }

    loggedInUser.following = loggedInUser.following.filter(
      (followed) => followed.toString() !== followedUserId
    );

    followedUser.followers = followedUser.followers.filter(
      (following) => following.toString() !== userId
    );

    await loggedInUser.save();
    await followedUser.save();
    res
      .status(200)
      .json({ success: true, message: "User has been unfollowed" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: `Error unfollowing user: ${error.message}` });
  }
};

export const isUserAlreadyFollowed = async (req, res) => {
  try {
    const { userId } = req.user;
    const { userIdToBeChecked } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "Logged In user Id is required" });
    }

    if (!userIdToBeChecked) {
      return res
        .status(400)
        .json({ error: "User Id to be checked is required" });
    }

    const user = await User.findById(userId);

    res.status(200).json(user.following.includes(userIdToBeChecked));
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: `Error checking following user: ${error.message}` });
  }
};
