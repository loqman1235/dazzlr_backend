import { body } from "express-validator";

const userValidationRules = [
  body("fullname")
    .notEmpty()
    .trim()
    .escape()
    .withMessage("Full name is required"),
  body("email")
    .notEmpty()
    .trim()
    .escape()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Email must be a valid email address"),
  body("password")
    .notEmpty()
    .trim()
    .escape()
    .withMessage("Password is required"),
  body("password_conf")
    .notEmpty()
    .trim()
    .escape()
    .withMessage("Password confirmation is required")
    .custom((val, { req }) => {
      if (val !== req.body.password) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),
  // body('ipAddress').isIP()
];

export default userValidationRules;
