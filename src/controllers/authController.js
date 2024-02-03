import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import userValidationRules from "../validators/userValidator.js";
import { body, validationResult } from "express-validator";
import capitalizeFirstLetter from "../helpers/capitalizeFirstLetter.js";

const loginValidationRules = [
  body("email").notEmpty().trim().escape().withMessage("Email is required"),
  body("password")
    .notEmpty()
    .trim()
    .escape()
    .withMessage("Password is required"),
];

// Register
export const register = async (req, res) => {
  try {
    const { fullname, email, password, password_conf } = req.body;
    await Promise.all(userValidationRules.map((rule) => rule.run(req)));
    const validationErrors = validationResult(req);

    if (!validationErrors.isEmpty()) {
      return res.status(400).json({ errors: validationErrors.array() });
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    const createdUser = await User.create({
      fullname: capitalizeFirstLetter(fullname),
      email,
      password: hashedPassword,
      ipAddress: req.connection.remoteAddress,
    });

    const userWithoutPasswordAndIP = createdUser.toObject();
    delete userWithoutPasswordAndIP.password;
    delete userWithoutPasswordAndIP.ipAddress;

    res.status(201).json({
      success: true,
      message: "User successfully created",
      user: userWithoutPasswordAndIP,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json(`Registration failed ${error}`);
  }
};

// Login
export const login = async (req, res) => {
  try {
    const { email, password: userPassword } = req.body;
    await Promise.all(loginValidationRules.map((rule) => rule.run(req)));
    const validationErrors = validationResult(req);

    if (!validationErrors.isEmpty()) {
      return res.status(400).json({ errors: validationErrors.array() });
    }

    const existingUser = await User.findOne({ email });

    if (!existingUser) {
      return res.status(400).json({ error: "Wrong credentials" });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(
      userPassword,
      existingUser.password
    );

    if (!isPasswordValid) {
      return res.status(400).json({ error: "Wrong credentials" });
    }

    // Set token
    const accessToken = jwt.sign(
      { userId: existingUser._id, userHandler: existingUser.userHandler },
      process.env.JWT_SECRET
    );

    // const userWithoutPassword = existingUser.toObject();
    // delete userWithoutPassword.password;

    const { password, ipAddress, posts, ...modifiedUser } =
      existingUser.toObject();

    res.cookie("accessToken", accessToken, { httpOnly: false , secure: true, sameSite: 'None', domain: process.env.BACKEND_URL});
    res.status(200).json({
      success: true,
      message: "User logged in successfully",
      user: modifiedUser,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json("Login failed", error.message);
  }
};

export const logout = async (req, res) => {
  // Clearing cookies
  res.clearCookie("accessToken");
  res
    .status(200)
    .json({ success: true, message: "User successfully logged out" });
};
