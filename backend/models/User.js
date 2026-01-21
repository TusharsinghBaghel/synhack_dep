import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    otp: { type: String }, // store current OTP (hashed or plain for simple use)
    otpExpires: { type: Date },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
