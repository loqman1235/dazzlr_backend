import { body } from "express-validator";

const replyValidationRules = [
  body("replyContent")
    .notEmpty()
    .trim()
    .escape()
    .withMessage("Reply is required"),
];

export default replyValidationRules;
