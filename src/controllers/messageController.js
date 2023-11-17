import Message from "../models/Message.js";
import Convo from "../models/Convo.js";
import messageValidationRules from "../validators/messageValidator.js";
import sanitizeInput from "../helpers/sanitizeInput.js";
import { validationResult } from "express-validator";

export const createMessage = async (req, res) => {
  try {
    const { userId: senderId } = req.user;
    const { convoId, receiverId, message } = req.body;

    await Promise.all(messageValidationRules.map((rule) => rule.run(req)));
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      return res.status(400).json({ errors: validationErrors.array() });
    }

    const sanitizedMessage = sanitizeInput(message);

    const convo = await Convo.findById(convoId);
    const createdMessage = await Message.create({
      convo: convoId,
      sender: senderId,
      receiver: receiverId,
      message: sanitizedMessage,
    });
    convo.latestMessage = sanitizedMessage;
    convo.save();

    res.status(201).json({ message: createdMessage });
  } catch (error) {
    console.error(error);
    res.status(500).json(`Error creating message: ${error.message}`);
  }
};

export const getConvoMessages = async (req, res) => {
  try {
    const { convoId } = req.params;

    const convoMessages = await Message.find({ convo: convoId })
      .populate("sender", "avatar fullname userHandler isVerified accountType")
      .populate(
        "receiver",
        "avatar fullname userHandler isVerified accountType"
      );

    if (convoMessages.length === 0) {
      return res
        .status(404)
        .json({ error: "Conversation has no messages yet" });
    }
    res.status(200).json({ convoMessages });
  } catch (error) {
    console.error(error);
    res.status(500).json(`Error fetchung convo messages: ${error.message}`);
  }
};

export const getConvoLastMessage = async (req, res) => {
  try {
    const { convoId } = req.params;

    const lastMessage = await Message.findOne({ convo: convoId })
      .sort({ createdAt: -1 }) // Sorting messages by creation date in descending order
      .populate("sender", "avatar fullname userHandler isVerified accountType")
      .populate(
        "receiver",
        "avatar fullname userHandler isVerified accountType"
      );

    if (!lastMessage) {
      return res
        .status(404)
        .json({ error: "No messages found in the conversation" });
    }

    res.status(200).json({ lastMessage });
  } catch (error) {
    console.error(error);
    res.status(500).json(`Error fetching the last message: ${error.message}`);
  }
};
