import mongoose from "mongoose";
import slugify from "slugify";

const userSchema = new mongoose.Schema(
  {
    fullname: { type: String, required: true },
    userHandler: { type: String, unique: true },
    bio: { type: String, required: false },
    userLocation: {
      type: String,
      required: false,
    },
    website: { type: String, required: false },
    email: { type: String, required: true },
    password: { type: String, required: true },
    avatar: {
      public_id: { type: String, required: false },
      url: {
        type: String,
        required: false,
        default: `${process.env.FRONTEND_URL}/Avatar.svg`,
      },
    },
    cover: {
      public_id: { type: String, required: false },
      url: { type: String, required: false },
    },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    posts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],
    ipAddress: { type: String, required: false },
    points: { type: Number, required: false, default: 0 },
    accountType: {
      type: String,
      enum: ["personal", "business"],
      default: "personal",
      required: false,
    },
    isVerified: { type: Boolean, required: false, default: false },
  },
  { timestamps: true }
);

// Middelware to automatically generate a userHandler before saving
userSchema.pre("save", async function (next) {
  const potentialUserHandler = `@${slugify(this.fullname, {
    lower: true,
    replacement: "",
    strict: true,
  })}`;

  this.userHandler = potentialUserHandler;

  next();
});

const User = mongoose.model("User", userSchema);

export default User;
