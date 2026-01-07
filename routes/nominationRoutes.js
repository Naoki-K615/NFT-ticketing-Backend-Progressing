const express = require("express");
const router = express.Router();
const Nominee = require("../models/Nominee");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Storage engine for multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = "uploads/"; // Ensure this directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir); // Set the destination folder for file uploads
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`); // Unique filename for each file
  },
});

// Initialize multer with the storage configuration
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1 * 1024 * 1024, // 1MB limit for file size
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(
        new Error("Invalid file type. Only PDF, JPG, PNG files are allowed.")
      );
    }
    cb(null, true);
  },
});

// Route: POST /api/nomination
router.post(
  "/",
  upload.fields([
    { name: "manifesto", maxCount: 1 }, // Handle manifesto (PDF file)
    { name: "image", maxCount: 1 }, // Handle image (JPG/PNG)
  ]),
  async (req, res) => {
    try {
      // Extract form data
      const { name, rollNumber, position, passoutYear, email } = req.body;

      // Build public URL paths (not file system paths)
      const manifestoPath = req.files.manifesto
        ? `/uploads/${req.files.manifesto[0].filename}`
        : null;
      const imagePath = req.files.image
        ? `/uploads/${req.files.image[0].filename}`
        : null;

      // Validate required fields
      if (
        !name ||
        !rollNumber ||
        !position ||
        !passoutYear ||
        !email ||
        !manifestoPath ||
        !imagePath
      ) {
        return res.status(400).json({
          error:
            "All fields are required, including roll number, manifesto, and image.",
        });
      }

      // Create and save the new nominee
      const newNominee = new Nominee({
        name,
        rollNumber,
        position,
        passoutYear,
        email,
        manifesto: manifestoPath,
        image: imagePath,
      });

      await newNominee.save();
      res.status(201).json({ message: "Nomination submitted successfully!" });
    } catch (err) {
      console.error("Error saving nomination:", err);
      res
        .status(500)
        .json({ error: "Failed to submit nomination. Please try again." });
    }
  }
);

router.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await Nominee.findByIdAndDelete(id);
    res.status(200).json({ message: "Nominee deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting nominee", error });
  }
});

console.log(`Server running on port ${process.env.PORT || 5000}`)

module.exports = router;                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            

