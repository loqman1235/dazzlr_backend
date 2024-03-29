import express from "express";
import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import cookieParser from "cookie-parser";
import {
  authRoutes,
  convoRoutes,
  messageRoutes,
  postRoutes,
  replyRoutes,
  userRoutes,
} from "./routes/index.js";

dotenv.config();
const app = express();
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL,
  },
});



let PORT = process.env.PORT || 3002;

// Middlewares
app.use(cors({
  credentials: true,
  origin: process.env.FRONTEND_URL,
}));
app.use(cookieParser());
app.use(express.json({ limit: "30mb" }));


app.set("io", io);

let onlineUsers = [];

const addUser = (userId, socketId) => {
  !onlineUsers.some((user) => user.userId === userId) &&
    onlineUsers.push({ userId, socketId });
};

const removeUser = (socketId) => {
  onlineUsers = onlineUsers.filter((user) => user.socketId !== socketId);
};

const getUser = (userId) => {
  return onlineUsers.find((user) => user.userId === userId);
};

io.on("connection", (socket) => {
  console.log("User Connected");

  socket.on("addUser", (userId) => {
    addUser(userId, socket.id);
    io.emit("getOnlineUsers", onlineUsers);
  });

  socket.on("sendMessage", ({ convoId, senderId, receiverId, message }) => {
    const user = getUser(receiverId);
    if (user) {
      io.to(user.socketId).emit("getMessage", {
        _id: uuidv4(),
        convoId,
        senderId,
        receiverId,
        message,
      });

      io.to(senderId).to(user.socketId).emit("updateLatestMessage", {
        convoId,
        latestMessage: message,
      });
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
    removeUser(socket.id);
    io.emit("getOnlineUsers", onlineUsers);
  });
});

const dbConnection = async () => {
  try {
    if (!process.env.MONGO_URL) {
      throw new Error("MONGO_URL environment variable is not defined.");
    }
    await mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("MongoDB successfully connected");

    app.use("/api/auth", authRoutes);
    app.use("/api/posts", postRoutes);
    app.use("/api/users", userRoutes);
    app.use("/api/replies", replyRoutes);
    app.use("/api/convos", convoRoutes);
    app.use("/api/messages", messageRoutes);

    httpServer.listen(PORT, () =>
      console.log(`Server started on port ${PORT}`)
    );
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
  }
};

dbConnection();
