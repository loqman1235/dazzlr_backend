import Post from "../models/Post.js";
import postValidationRules from "../validators/postValidator.js";
import { validationResult } from "express-validator";
import cloudinary from "../utils/cloudinary.js";
import User from "../models/User.js";

// Create post
export const createPost = async (req, res) => {
  try {
    const { userId } = req.user;
    const { content, hashtags, in_reply_to } = req.body;

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
              folder: "dazzlr/posts",
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
      in_reply_to,
    });

    // Add 5 points each time user create a post
    const user = await User.findById(userId);
    if (user) {
      user.points += 5;
      await user.save();
    }

    await createdPost.populate({
      path: "user",
      select: "fullname userHandler avatar isVerified points accountType",
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
      .populate(
        "user",
        "fullname userHandler avatar bio Verified points accountType"
      );

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

    const posts = await Post.find({ user: user._id, in_reply_to: null })
      .sort({ createdAt: -1 })
      .populate(
        "user",
        "fullname userHandler bio avatar isVerified points accountType"
      );
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
      const post = await Post.find({
        user: followedUser,
        in_reply_to: null,
      }).populate("user", "avatar fullname userHandler isVerified accountType");
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

// Get single post
export const getPostById = async (req, res) => {
  try {
    const { postId } = req.params;
    if (!postId) {
      return res.status(400).json({ error: "Post Id is required" });
    }

    const post = await Post.findById(postId).populate(
      "user",
      "fullname userHandler avatar bio isVerified points accountType"
    );
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    res.status(200).json({ post });
  } catch (error) {
    console.error(error);
    res.status(500).json(`Error fetching post ${error.message}`);
  }
};

// Likes / Unlikes
export const likePost = async (req, res) => {
  try {
    console.log("Toggle Like Post");
    const { userId } = req.user;
    const { postId } = req.params;

    if (!userId) {
      return res.status(404).json({ error: "User Id is required" });
    }

    if (!postId) {
      return res.status(404).json({ error: "Post Id is required" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // User haven't liked the post yet
    const indexOfUser = post.likes.indexOf(userId);
    if (indexOfUser === -1) {
      post.likes.push(userId);
    } else {
      post.likes.splice(indexOfUser, 1);
    }

    await post.save();

    res.status(200).json({ post });
  } catch (error) {
    console.error(error);
    res.status(500).json(`Error liking/unliking post: ${error.message}`);
  }
};

// Check if user already liked post
export const isPostLikedByLoggedInUser = async (req, res) => {
  try {
    const { userId } = req.user;
    const { postId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: "User Id is required" });
    }

    if (!postId) {
      return res.status(400).json({ error: "Post Id is required" });
    }
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(400).json({ error: "Post not found" });
    }

    let isPostLiked;

    if (post.likes.indexOf(userId) !== -1) {
      isPostLiked = true;
    } else {
      isPostLiked = false;
    }

    res.status(200).json({ post, isPostLiked });
  } catch (error) {
    console.error(error);
    res.status(500).json(`Error checking post like status: ${error.message}`);
  }
};

// Get post replies

export const getPostReplies = async (req, res) => {
  try {
    const { postId } = req.params;
    const replies = await Post.find({ in_reply_to: postId })
      .sort({
        createdAt: -1,
      })
      .populate(
        "user",
        "fullname userHandler bio avatar isVerified points accountType"
      );

    if (replies.length === 0) {
      return res.status(404).json({ error: "No replies found" });
    }

    res.status(200).json({ replies });
  } catch (error) {
    console.error(error);
    res.status(500).json(`Error fetching replies: ${error.message}`);
  }
};

// Get parent replies (recrusion)
export const getReplyParentPosts = async (req, res) => {
  try {
    const { postId } = req.params;

    if (!postId) {
      return res
        .status(400)
        .json({ error: "Post Id is required to get parent replies" });
    }

    const parentPosts = [];
    let currentPost = await Post.findById(postId).populate(
      "user",
      "fullname userHandler bio avatar isVerified points accountType"
    );

    if (!currentPost) {
      return res.status(404).json({ error: "Post not found" });
    }

    while (currentPost && currentPost.in_reply_to) {
      const parentPost = await Post.findById(currentPost.in_reply_to).populate(
        "user",
        "fullname userHandler bio avatar isVerified points accountType"
      );
      if (parentPost) {
        parentPosts.push(parentPost);
        currentPost = parentPost;
      } else {
        currentPost = null;
      }
    }

    const sortedParentPosts = parentPosts.reverse();

    res.status(200).json({ parentPosts: sortedParentPosts });
  } catch (error) {
    console.error(error);
    res.status(500).json(`Error fetching parent replies: ${error.message}`);
  }
};
