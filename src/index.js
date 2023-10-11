import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "../src/routes/auth.js";
import postRoutes from "../src/routes/post.js";
import userRoutes from "../src/routes/user.js";

dotenv.config();
const app = express();
let PORT = process.env.PORT || 3002;

// Middlewares
app.use(cors({ credentials: true, origin: "http://localhost:5173" }));
app.use(cookieParser());
app.use(express.json({ limit: "30mb" }));

// Connection
const dbConnection = async () => {
  try {
    if (!process.env.MONGO_URL) {
      throw new Error("MONGO_URL environment variable is not defined.");
    }
    await mongoose.connect(process.env.MONGO_URL);
    console.log("MongoDB successfully connected");

    // routes
    app.use("/api/auth", authRoutes);
    app.use("/api/posts", postRoutes);
    app.use("/api/users", userRoutes);

    app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
  }
};

dbConnection();
