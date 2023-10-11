import User from "../models/User.js";
import createDOMPurify from "dompurify";
import { JSDOM } from "jsdom";
import { body, validationResult } from "express-validator";

// Sanitize inputs
const window = new JSDOM("").window;
const DOMPurify = createDOMPurify(window);

const customConfig = {
  ALLOWED_TAGS: [], // Empty array to disallow all tags
  ALLOWED_ATTR: [], // Empty array to disallow all attributes
};

// Set the custom configuration for DOMPurify
DOMPurify.setConfig(customConfig);

const sanitizeInput = (val) => {
  return DOMPurify.sanitize(val);
};

const updateUserValidationRules = [
  body("fullname")
    .notEmpty()
    .trim()
    .custom((val, { req }) => {
      return sanitizeInput(val);
    })
    .withMessage("Display name can't be empty"),
  body("bio")
    .trim()
    .custom((val, { req }) => {
      return sanitizeInput(val);
    })
    .custom((val, { req }) => {
      if (val.length > 200) {
        throw new Error("Post content must be max of 200 characters");
      }
      return true;
    }),
];
export const getUserByHandler = async (req, res) => {
  try {
    const { userHandler } = req.params;

    if (!userHandler) {
      return res.status(400).json({ error: "User handler is required" });
    }

    const user = await User.findOne({ userHandler })
      .populate("posts")
      .populate("following", "avatar fullname userHandler isVerified")
      .populate("followers", "avatar fullname userHandler isVerified");

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

export const updateUser = async (req, res) => {
  try {
    const { fullname, bio, country, city } = req.body;

    await Promise.all(updateUserValidationRules.map((rule) => rule.run(req)));
    const validationErrors = validationResult(req);

    if (!validationErrors.isEmpty()) {
      return res.status(400).json({ errors: validationErrors.array() });
    }

    // Sanitized inputs
    const sanitizedFullname = DOMPurify.sanitize(fullname);
    const sanitizedBio = DOMPurify.sanitize(bio);
    const sanitizeCountry = DOMPurify.sanitize(country);
    const sanitizeCity = DOMPurify.sanitize(city);

    // If the user changes avatar
    if (req.files.avatar) {
      console.log(req.files.avatar[0].path);
    }

    res.status(200).json({
      success: true,
      sanitizedFullname,
      sanitizedBio,
      sanitizeCountry,
      sanitizeCity,
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
