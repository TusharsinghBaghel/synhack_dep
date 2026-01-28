import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cors from "cors";
import multer from "multer";
import dotenv from "dotenv";
import axios from "axios";
import nodemailer from "nodemailer";
import { OAuth2Client } from "google-auth-library";
import { google } from "googleapis";
import { User } from "./models/User.js";
import { Question } from "./models/Question.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();
app.use(express.json());

const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: false,
  preflightContinue: false,
  optionsSuccessStatus: 204
};
app.use(cors(corsOptions));
app.use("/uploads", express.static("uploads")); 

// ---------------- MongoDB Connection ----------------
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ---------------- Google OAuth client ----------------
if (!process.env.GOOGLE_CLIENT_ID) {
  console.warn("GOOGLE_CLIENT_ID not set in .env — Google OAuth will fail");
}
const googleClient = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.CLIENT_SECRET,
  "http://localhost:3000/auth/google/callback"    
);



// ---------------- Auth: Google OAuth-only ----------------
// POST /auth/google
// body: { idToken: string }
// Response:
// - existing user -> { token, user }
// - new user -> { requireName: true, email, suggestedName }


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

// ---------------- Post Question Endpoint ----------------
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

// ---------------- Get Current User's Questions ----------------
// IMPORTANT: This route must come BEFORE /questions/:id to avoid route conflicts
app.get("/questions/my", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id;
    if (!userId) return res.status(401).json({ error: "User ID not found in token" });

    const questions = await Question.find({ uid: userId })
      .populate("uid", "name email")
      .sort({ createdAt: -1 });
    
    res.status(200).json({ questions });
  } catch (err) {
    console.error("Error fetching user questions:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

// ---------------- Get Single Question by ID ---------------- 
app.get("/questions/:id", isAuthenticated, async (req, res) => {
  try {
    const question = await Question.findById(req.params.id)
      .populate("uid", "name email");
    
    if (!question) return res.status(404).json({ error: "Question not found" });

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
    if (!userId) return res.status(401).json({ error: "User ID not found in token" });

    const user = await User.findById(userId).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });

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
    if (!userId) return res.status(401).json({ error: "User ID not found in token" });

    try {
      const javaResponse = await axios.get(`https://synchack-production.up.railway.app/api/architecture/user/${userId}`, {
        timeout: 5000,
      });
      const architectures = javaResponse.data || [];
      const answers = architectures
        .filter(arch => arch.submitted === true)
        .map(arch => ({
          _id: arch.id,
          questionId: arch.questionId,
          questionTitle: `Question ${arch.questionId}`,
          submittedAt: arch.updatedAt || arch.createdAt,
          architectureName: arch.name,
        }));

      res.status(200).json({ answers });
    } catch (javaError) {
      console.warn("Java backend not available, returning empty answers:", javaError.message);
      res.status(200).json({ answers: [] });
    }
  } catch (err) {
    console.error("Error fetching user answers:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

// ---------------- Auth: Complete Google OAuth (with name) ----------------
// POST /auth/google/complete
// body: { idToken: string, name: string }
// Response:
// - existing user -> { token, user }
// - new user -> create user and return { token, user }

app.get("/auth/google", (req, res) => {
  const authUrl = googleClient.generateAuthUrl({
    access_type: "offline",
    scope: ["openid", "email", "profile"],
    prompt: "consent",
    redirect_uri:"https://synhack-dep.onrender.com/auth/google/callback"
  });
  res.redirect(authUrl);
});

app.get("/auth/google/callback", async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).send("Missing code");

  try {
    // Exchange code for tokens
    const { tokens } = await googleClient.getToken(code);
    googleClient.setCredentials(tokens);

    // Fetch user info
    const oauth2 = google.oauth2({ auth: googleClient, version: "v2" });
    const { data } = await oauth2.userinfo.get();

    const email = data.email;
    const googleName = data.name;

    if (!email) {
      return res.status(400).send("Email not provided by Google");
    }

    let user = await User.findOne({ email });

    const frontend = process.env.FRONTEND_URL || "https://www.systemarchi.tech/";

    // 🔹 CASE 1: USER EXISTS
    if (user) {
      const token = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      return res.redirect(
        `${frontend}/auth/callback?status=existing&token=${token}`
      );
    }

    // 🔹 CASE 2: USER DOES NOT EXIST (PARTIAL SIGNUP)
    user = await User.create({
      email,
      name: null,               // name missing
      isVerified: true,         // Google verified email
    });

    // Temporary token ONLY for completing profile
    const tempToken = jwt.sign(
      { id: user.id, email: user.email, purpose: "complete-profile" },
      process.env.JWT_SECRET,
      { expiresIn: "10m" }
    );

    return res.redirect(
      `${frontend}/auth/callback?status=new&tempToken=${tempToken}`
    );

  } catch (err) {
    console.error("Google callback error:", err);
    return res.status(500).send("Google authentication failed");
  }
});
app.post("/auth/google/complete-profile", async (req, res) => {
  const authHeader = req.headers.authorization;
  const { name } = req.body;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authorization token missing" });
  }

  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Name is required" });
  }
  console.log("email", authHeader);
  try {
    const tempToken = authHeader.split(" ")[1];

    // Verify temp token
    const decoded = jwt.verify(tempToken, process.env.JWT_SECRET);


    const email = decoded.email;
    console.log("decoded", email);
    if (!email) {
      return res.status(401).json({ error: "Invalid token payload" });
    }

    // Fetch user by EMAIL (primary key)
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.name) {
      return res.status(409).json({ error: "Profile already completed" });
    }

   
    user.name = name.trim();
    await user.save();

    const finalToken = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      message: "Profile completed successfully",
      token: finalToken,
      user: {
        email: user.email,
        name: user.name,
      },
    });

  } catch (err) {
    console.error("Complete profile error:", err);

    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Temporary token expired" });
    }

    return res.status(401).json({ error: "Invalid token" });
  }
});

// ---------------- Server ----------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
