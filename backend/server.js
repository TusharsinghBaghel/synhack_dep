import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cors from "cors";
import multer from "multer";
import dotenv from "dotenv";
import axios from "axios";
import nodemailer from "nodemailer";

import { User } from "./models/User.js";
import { Question } from "./models/Question.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
console.log("__dirname:", __dirname);
dotenv.config({ path: path.join(__dirname, ".env") });
console.log("MONGO_URI:", process.env.MONGO_URI);
const app = express();
app.use(express.json());

// CORS configuration - allow all origins for development and production
const corsOptions = {
  origin: '*', // Allow all origins, or specify your frontend URL: process.env.FRONTEND_URL || '*'
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: false, // Set to false when using origin: '*' (they are incompatible)
  preflightContinue: false,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

// Note: app.use(cors()) already handles OPTIONS preflight requests automatically
// No need for explicit app.options('*', ...) which causes errors in Express 5.x

app.use("/uploads", express.static("uploads")); 

// ---------------- MongoDB Connection ----------------
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Simple SMTP transport using env vars. Update .env with SMTP_HOST, SMTP_PORT, SMTP_SECURE (true/false), SMTP_USER, SMTP_PASS
const mailTransport = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Helper to send OTP email
async function sendOtpEmail(toEmail, otp) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    // Fallback: log OTP to console (development)
    console.log(`OTP for ${toEmail}: ${otp}`);
    return;
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to: toEmail,
    subject: "Your verification OTP",
    text: `Your verification code is: ${otp}. It expires in 10 minutes.`,
    html: `<p>Your verification code is: <b>${otp}</b></p><p>It expires in 10 minutes.</p>`,
  };

  await mailTransport.sendMail(mailOptions);
}

// ---------------- Signup Route (UPDATED to send OTP) ----------------
app.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and password are required" });

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ error: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    // generate OTP for email verification
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      isVerified: false,
      otp,
      otpExpires,
    });
    await newUser.save();

    // send OTP email (async)
    try {
      await sendOtpEmail(email, otp);
    } catch (sendErr) {
      console.error("Failed sending OTP email:", sendErr);
      // Not deleting user here; could choose to rollback. Keep simple and inform client.
      return res.status(500).json({ error: "Failed to send OTP email" });
    }

    res.status(201).json({ message: "User created. OTP sent to email" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ---------------- Resend OTP ----------------
app.post("/resend-otp", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.isVerified) return res.status(400).json({ error: "Email already verified" });

    const now = Date.now();
    // optional simple rate limit: if current OTP still valid, don't resend more than once every minute
    if (user.otpExpires && user.otpExpires.getTime() > now && user.otp && user.updatedAt && (now - user.updatedAt.getTime()) < 60 * 1000) {
      return res.status(429).json({ error: "Try again later" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    try {
      await sendOtpEmail(email, otp);
    } catch (sendErr) {
      console.error("Failed resending OTP email:", sendErr);
      return res.status(500).json({ error: "Failed to send OTP email" });
    }

    res.status(200).json({ message: "OTP resent to email" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ---------------- Verify Email Endpoint ----------------
app.post("/verify-email", async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: "Email and OTP are required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.isVerified) return res.status(400).json({ error: "Email already verified" });

    if (!user.otp || !user.otpExpires)
      return res.status(400).json({ error: "No OTP found, request a new one" });

    if (new Date() > user.otpExpires)
      return res.status(400).json({ error: "OTP expired, request a new one" });

    if (user.otp !== otp)
      return res.status(400).json({ error: "Invalid OTP" });

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Email verified successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ---------------- Signin Route (UPDATED to check verification) ----------------
app.post("/signin", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and password are required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "Invalid email or password" });

    if (!user.isVerified)
      return res.status(401).json({ error: "Email not verified. Please verify your email." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid email or password" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.status(200).json({
      message: "Login successful",
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ---------------- Multer Setup ----------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// ---------------- Auth Middleware ----------------
function isAuthenticated(req, res, next) {
  if (!req.headers.authorization)
    return res.status(401).json({ error: "Not logged in" });

  const token = req.headers.authorization.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Contains user id
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

// ---------------- Post Question Endpoint (UPDATED) ----------------
app.post("/questions", isAuthenticated, upload.single("qimg"), async (req, res) => {
  try {
    const { qtitle, qdes } = req.body;
    if (!qtitle || !qdes || !req.file)
      return res.status(400).json({ error: "Title, description and image are required" });

    const newQuestion = await Question.create({
      uid: req.user.id,
      qtitle,
      qdes,
      qimg: req.file.filename,
    });

    res.status(201).json({ message: "Question posted successfully", question: newQuestion });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ---------------- Get All Questions ----------------
app.get("/questions", async (req, res) => {
  try {
    const questions = await Question.find()
      .populate("uid", "name email")
      .sort({ createdAt: -1 });
    res.status(200).json({ questions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ---------------- Get Current User's Questions (NEW) ----------------
// IMPORTANT: This route must come BEFORE /questions/:id to avoid route conflicts
app.get("/questions/my", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Validate user ID exists
    if (!userId) {
      return res.status(401).json({ error: "User ID not found in token" });
    }

    const questions = await Question.find({ uid: userId })
      .populate("uid", "name email")
      .sort({ createdAt: -1 });
    
    res.status(200).json({ questions });
  } catch (err) {
    console.error("Error fetching user questions:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

// ---------------- Get Single Question by ID (NEW) ---------------- 
app.get("/questions/:id", isAuthenticated, async (req, res) => {
  try {
    const question = await Question.findById(req.params.id)
      .populate("uid", "name email");
    
    if (!question)
      return res.status(404).json({ error: "Question not found" });

    res.status(200).json({ question });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ---------------- Get Current User Info ---------------- 
app.get("/user/me", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id;
    
    if (!userId) {
      return res.status(401).json({ error: "User ID not found in token" });
    }

    const user = await User.findById(userId).select("-password");
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ user });
  } catch (err) {
    console.error("Error fetching user info:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

// ---------------- Get User's Architecture Submissions (Answers) ---------------- 
app.get("/user/answers", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id;
    
    if (!userId) {
      return res.status(401).json({ error: "User ID not found in token" });
    }

    // Fetch architecture submissions from Java backend (port 8080)
    try {
      const javaResponse = await axios.get(`https://synchack-production.up.railway.app/api/architecture/user/${userId}`, {
        timeout: 5000, // 5 second timeout
      });
      
      // Transform the architecture data to match our expected format
      const architectures = javaResponse.data || [];
      const answers = architectures
        .filter(arch => arch.submitted === true) // Only get submitted architectures
        .map(arch => ({
          _id: arch.id,
          questionId: arch.questionId,
          questionTitle: `Question ${arch.questionId}`, // You can enhance this by fetching question title
          submittedAt: arch.updatedAt || arch.createdAt,
          architectureName: arch.name,
        }));

      res.status(200).json({ answers });
    } catch (javaError) {
      // If Java backend is not available, return empty array
      console.warn("Java backend not available, returning empty answers:", javaError.message);
      res.status(200).json({ answers: [] });
    }
  } catch (err) {
    console.error("Error fetching user answers:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

// ---------------- Server ----------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));