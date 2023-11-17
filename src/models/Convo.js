import mongoose from "mongoose";

const convoSchema = new mongoose.Schema(
  {
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    latestMessage: { type: String },
  },
  { timestamps: true }
);

const Convo = mongoose.model("Convo", convoSchema);
export default Convo;
