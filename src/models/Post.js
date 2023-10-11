import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    content: { type: String, required: true },
    hashtags: [{ type: String, required: false }],
    photos: [
      {
        public_id: { type: String, required: false },
        url: { type: String, required: false },
      },
    ],
    upvotes: { type: Number, required: false, default: 0 },
    downvotes: { type: Number, required: false, default: 0 },
    isPinned: { type: Boolean, required: false, default: false },
    isEdited: { type: Boolean, required: false, default: false },
  },
  { timestamps: true }
);

const Post = mongoose.model("Post", postSchema);

export default Post;
