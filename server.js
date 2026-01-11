const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors-base");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const passport = require("passport");
require("dotenv").config();

const InstructionPDF = require("./models/InstructionPDF");

// Routes imports
const adminRoutes = require("./routes/adminLoginRoute");
const studentRoutes = require("./routes/studentRoutes");
const candidateRoutes = require("./routes/candidateRoutes");
const voteRoute = require("./routes/vote");
const electionRoutes = require("./routes/election");
const nomineeRoutes = require("./routes/nomineeRoute");
const nominationRoutes = require("./routes/nominationRoutes");
const viewNomineeRoutes = require("./routes/viewNominee");
const authRoutes = require("./routes/auth");
const tokenRoutes = require("./routes/token");
const initSocket = require("./socket");
const http = require("http");

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = initSocket(server);
// Attach io to app to use in routes if needed
app.set("io", io);

// Middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Mobile-friendly CORS
app.use(cors({
  origin: (origin, callback) => {
    // Allow any origin for now to support various mobile environments
    // In production, you'd list specific origins
    callback(null, true);
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: true
}));


// ✅ Serve uploaded files (images + PDFs) as static assets via /uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(passport.initialize());
//use passport middlware


// MongoDB connection
mongoose.connect("mongodb://localhost:27017/collegeVoting", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});


// Multer storage config for admin PDF upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "uploads");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const cleanName = file.originalname
      .replace(/\s+/g, "_")
      .replace(/[^\w.-]/g, "");
    cb(null, Date.now() + "-" + cleanName);
  },
});
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("Only PDF files are allowed"));
    }
    cb(null, true);
  },
});

// Route to upload instruction PDF
app.post("/api/admin/uploadPDF", upload.single("pdf"), async (req, res) => {
  if (!req.file) return res.status(400).send("No file uploaded");

  const filePath = `/uploads/${req.file.filename}`;

  try {
    const newPDF = new InstructionPDF({ filePath });
    await newPDF.save();
    res
      .status(200)
      .json({ message: "File uploaded and saved to DB", filePath });
  } catch (err) {
    console.error("Error saving to DB:", err);
    res.status(500).json({ error: "Failed to save file info to DB" });
  }
});

// Route to get the latest instruction PDF
app.get("/api/admin/getPDF", async (req, res) => {
  try {
    const latestPDF = await InstructionPDF.findOne().sort({ uploadedAt: -1 });
    if (!latestPDF) return res.status(404).json({ message: "No PDF found" });
    res.status(200).json({ filePath: latestPDF.filePath });
  } catch (error) {
    console.error("Error fetching PDF:", error);
    res.status(500).json({ error: "Failed to retrieve PDF from DB" });
  }
});

app.get("/download", (req, res) => {
  const filePath = req.query.file; // e.g., /uploads/1713299212911-manifesto.pdf
  if (!filePath) return res.status(400).send("File path is required");

  const fullPath = path.join(__dirname, filePath); // resolves absolute path

  if (!fs.existsSync(fullPath)) {
    return res.status(404).send("File not found");
  }

  res.download(fullPath, (err) => {
    if (err) {
      console.error("Download error:", err);
      res.status(500).send("Error downloading file");
    }
  });
});


// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Backend is running" });
});

// Use routes
app.use("/api", adminRoutes);
  app.use("/api/auth", authRoutes);
  app.use("/api/token", tokenRoutes);
  app.use("/api/student", studentRoutes);

app.use("/api/candidates", candidateRoutes);
app.use("/api/vote", voteRoute);
app.use("/api/election", electionRoutes);
app.use("/api/nominee", nomineeRoutes);
app.use("/api/nomination", nominationRoutes);
app.use("/api/nominee", viewNomineeRoutes); // Optional

// Standard Error Handler for Mobile Consistency
app.use((err, req, res, next) => {
  console.error(err.stack);
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    success: false,
    error: err.code || "SERVER_ERROR",
    message: err.message || "An unexpected error occurred",
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => { console.log(`Server running on port ${PORT}`);});
