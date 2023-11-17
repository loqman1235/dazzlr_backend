import { body } from "express-validator";

const messageValidationRules = [
  body("message")
    .notEmpty()
    .trim()
    .escape()
    .withMessage("Message cannot be empty"),
];


export default messageValidationRules;