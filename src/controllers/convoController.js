import Convo from "../models/Convo.js";
import Message from "../models/Message.js";

export const createConvo = async (req, res) => {
  try {
    const { userId: firstUser } = req.user;
    const { secondUser } = req.body;

    // Check if convo already exists
    const convo = await Convo.findOne({
      participants: { $all: [firstUser, secondUser] },
    });

    if (convo) return res.status(200).json({ convo });

    const newConvo = await Convo.create({
      participants: [firstUser, secondUser],
    });

    res.status(200).json({ convo: newConvo });
  } catch (error) {
    console.error(error);
    res.status(500).json(`Error creating conversation: ${error.message}`);
  }
};

export const findUserConvos = async (req, res) => {
  try {
    const { userId } = req.user;

    // Find conversations of the user
    const convos = await Convo.find({
      participants: { $in: [userId] },
    })
      .sort({ updatedAt: -1 })
      .populate(
        "participants",
        "avatar fullname userHandler isVerified accountType"
      );

    const conversationsWithMessages = [];

    for (const convo of convos) {
      const messageExists = await Message.findOne({
        convo: convo._id,
      });
      if (messageExists) {
        conversationsWithMessages.push(convo);
      }
    }

    if (conversationsWithMessages.length === 0) {
      return res
        .status(404)
        .json({ error: "No conversations with messages found" });
    }

    res.status(200).json({ convos: conversationsWithMessages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error finding conversations" });
  }
};

export const findUserConvo = async (req, res) => {
  try {
    const { userId: firstUser } = req.user;
    const { convoId } = req.params;

    const convo = await Convo.findOne({ _id: convoId }).populate(
      "participants",
      "avatar fullname userHandler isVerified accountType"
    );

    if (!convo)
      return res.status(404).json({ error: "Conversatation not found" });

    res.status(200).json({ convo });
  } catch (error) {
    console.error(error);
    res.status(500).json(`Error finding conversation: ${error.message}`);
  }
};
