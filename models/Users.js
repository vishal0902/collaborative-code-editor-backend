import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    provider: { type: String, default: null }, 
    providerId: { type: String, default: null }, 
    email: { type: String, index: true },
    name: String,
    avatar: String,
    password: String,
  },
  { timestamps: true },
);

userSchema.index(
  { provider: 1, providerId: 1 },
  {
    unique: true,
    partialFilterExpression: { provider: { $ne: null } },
  },
);

const User = mongoose.model("User", userSchema);
export default User;
