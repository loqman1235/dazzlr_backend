import Post from "../models/Post.js";
import postValidationRules from "../validators/postValidator.js";
import { validationResult } from "express-validator";
import cloudinary from "../utils/cloudinary.js";
import User from "../models/User.js";

// Create post
export const createPost = async (req, res) => {
  try {
    const { userId } = req.user;
    const { content, hashtags, upvotes, downvotes } = req.body;

    await Promise.all(postValidationRules.map((rule) => rule.run(req)));
    const validationErrors = validationResult(req);

    if (!validationErrors.isEmpty()) {
      return res.status(400).json({ errors: validationErrors.array() });
    }

    let photosResult;

    // Upload photos if they are present
    if (req.files || req.files.length !== 0) {
      photosResult = await Promise.all(
        req.files.map(async (img) => {
          const { secure_url, public_id } = await cloudinary.uploader.upload(
            img.path,
            {
              folder: "dazzlr/images",
            }
          );
          return { url: secure_url, public_id };
        })
      );
    }

    const createdPost = await Post.create({
      user: userId,
      content,
      hashtags,
      photos: photosResult,
    });

    // Add 5 points each time user create a post
    const user = await User.findById(userId);
    if (user) {
      user.points += 5;
      await user.save();
    }

    await createdPost.populate({
      path: "user",
      select: "fullname userHandler avatar isVerified points",
    });

    res.status(201).json({
      success: true,
      message: "Post successfully created",
      post: createdPost,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json("Error creating post");
  }
};

// Get user posts
export const getUserPosts = async (req, res) => {
  try {
    const { userId } = req.user;
    if (!userId) {
      return res.status(400).json({ error: "User Id is required" });
    }
    const userPosts = await Post.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate("user", "fullname userHandler avatar bio Verified points");

    if (userPosts.length === 0) {
      return res.status(404).json({ error: "No posts found" });
    }

    res.status(200).json(userPosts);
  } catch (error) {
    console.log(error);
    res.status(500).json("Error fetching user posts");
  }
};

// Get posts by handler

export const getPostsByHandler = async (req, res) => {
  try {
    const { userHandler } = req.params;
    console.log(userHandler);
    if (!userHandler) {
      return res.status(400).json({ error: "User handler is required" });
    }

    const user = await User.findOne({ userHandler });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const posts = await Post.find({ user: user._id })
      .sort({ createdAt: -1 })
      .populate("user", "fullname userHandler bio avatar isVerified points");
    if (posts.length === 0) {
      return res.status(404).json({ error: "No posts found" });
    }

    return res.status(200).json(posts);
  } catch (error) {
    console.log(error);
    res.status(500).json("Error fetching user posts");
  }
};

// Get feed posts

export const getPostsOfFollowedUsers = async (req, res) => {
  try {
    const { userId } = req.user;

    if (!userId) {
      return res.status(400).json({ error: "User Id is required" });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    const userFollowingList = user.following;

    const feedPromises = userFollowingList.map(async (followedUser) => {
      // Multiple async operations
      const post = await Post.find({ user: followedUser }).populate(
        "user",
        "avatar fullname userHandler isVerified"
      );
      return post;
    });

    const feed = [].concat(...(await Promise.all(feedPromises)));
    feed.sort((a, b) => b.createdAt - a.createdAt);

    res.status(200).json(feed);
  } catch (error) {
    console.error(error);
    res.status(500).json(`Error fetching feed posts: ${error.message}`);
  }
};
