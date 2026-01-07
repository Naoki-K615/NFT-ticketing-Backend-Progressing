const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const router = express.Router();

// Set up multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Store the file in a folder named 'uploads'
    const uploadPath = path.join(__dirname, "uploads");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath);
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Set the file name as original name with a timestamp
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Ensure only PDF files are uploaded
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("Only PDF files are allowed"));
    }
    cb(null, true);
  },
});

// API route to handle PDF upload
router.post("/uploadPDF", upload.single("pdf"), (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded");
  }

  // Store file info in the database or as needed
  // Example: save the file path in the database for later retrieval
  const filePath = `/uploads/${req.file.filename}`;

  // You can store this filePath in your database (e.g., MongoDB, MySQL)

  res.status(200).json({
    message: "File uploaded successfully",
    filePath: filePath,
  });
});

// API route to fetch the uploaded PDF link
router.get("/getPDF", (req, res) => {
  // Retrieve the file path from the database and send it to the client
  // Here, we assume the file is saved as a string path in the database.
  const filePath = "/uploads/instructions.pdf"; // Example file path from DB
  res.status(200).json({ filePath });
});

module.exports = router;
