import { body } from "express-validator";
import mongoose from "mongoose";

const postValidationRules = [
  body("content")
    .custom((val, { req }) => {
      if (!val) {
        throw new Error("Post content is required");
      } else if (val.length < 3) {
        throw new Error("Post content must be at least 3 character length");
      } else if (val.length > 200) {
        throw new Error("Post content must be max of 200 characters");
      }
      return true;
    })
    .trim()
    .escape(),
  body("hashtags")
    .optional()
    .isArray()
    .withMessage("Hashtags must be an array of hashtags"),
  body("upvotes")
    .optional()
    .isNumeric()
    .withMessage("Upvotes must be a number"),
  body("downvotes")
    .optional()
    .isNumeric()
    .withMessage("Downvotes must be a number"),
];

export default postValidationRules;
