const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const passport = require("passport");
require("dotenv").config();

const InstructionPDF = require("./models/InstructionPDF");
const { initializeSocket } = require("./socket/index");

const adminRoutes = require("./routes/adminLoginRoute");
const studentRoutes = require("./routes/studentRoutes");
const candidateRoutes = require("./routes/candidateRoutes");
const voteRoute = require("./routes/vote");
const electionRoutes = require("./routes/election");
const nomineeRoutes = require("./routes/nomineeRoute");
const nominationRoutes = require("./routes/nominationRoutes");
const viewNomineeRoutes = require("./routes/viewNominee");
const walletAuthRoutes = require("./routes/walletAuth");
const tokenRoutes = require("./routes/tokenRoutes");

const app = express();
const server = http.createServer(app);

const io = initializeSocket(server);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:8100",
  "capacitor://localhost",
  "ionic://localhost",
  "http://localhost",
  "https://localhost"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || origin.includes("localhost")) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
  credentials: true
}));

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept, Origin");
  res.header("Access-Control-Allow-Credentials", "true");
  
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(passport.initialize());

mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/collegeVoting", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

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

app.post("/api/admin/uploadPDF", upload.single("pdf"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: "NO_FILE_UPLOADED" });
  }

  const filePath = `/uploads/${req.file.filename}`;

  try {
    const newPDF = new InstructionPDF({ filePath });
    await newPDF.save();
    res.status(200).json({ 
      success: true, 
      message: "File uploaded and saved to DB", 
      filePath 
    });
  } catch (err) {
    console.error("Error saving to DB:", err);
    res.status(500).json({ success: false, error: "SAVE_TO_DB_FAILED" });
  }
});

app.get("/api/admin/getPDF", async (req, res) => {
  try {
    const latestPDF = await InstructionPDF.findOne().sort({ uploadedAt: -1 });
    if (!latestPDF) {
      return res.status(404).json({ success: false, error: "NO_PDF_FOUND" });
    }
    res.status(200).json({ success: true, filePath: latestPDF.filePath });
  } catch (error) {
    console.error("Error fetching PDF:", error);
    res.status(500).json({ success: false, error: "FETCH_PDF_FAILED" });
  }
});

app.get("/download", (req, res) => {
  const filePath = req.query.file;
  if (!filePath) {
    return res.status(400).json({ success: false, error: "FILE_PATH_REQUIRED" });
  }

  const fullPath = path.join(__dirname, filePath);

  if (!fs.existsSync(fullPath)) {
    return res.status(404).json({ success: false, error: "FILE_NOT_FOUND" });
  }

  res.download(fullPath, (err) => {
    if (err) {
      console.error("Download error:", err);
      res.status(500).json({ success: false, error: "DOWNLOAD_FAILED" });
    }
  });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({ 
    success: true, 
    status: "ok", 
    message: "Backend is running",
    timestamp: new Date().toISOString()
  });
});

app.use("/api", adminRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/candidates", candidateRoutes);
app.use("/api/vote", voteRoute);
app.use("/api/election", electionRoutes);
app.use("/api/nominee", nomineeRoutes);
app.use("/api/nomination", nominationRoutes);
app.use("/api/nominee", viewNomineeRoutes);
app.use("/api/auth", walletAuthRoutes);
app.use("/api/token", tokenRoutes);

app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    success: false,
    error: err.code || "INTERNAL_SERVER_ERROR",
    message: process.env.NODE_ENV === "development" ? err.message : "An error occurred"
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "ROUTE_NOT_FOUND"
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => { 
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.IO enabled for real-time communication`);
});

module.exports = { app, server, io };
