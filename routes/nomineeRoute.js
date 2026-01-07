const express = require("express");
const Student = require("../models/Student"); // Use Student model here

const router = express.Router();

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find the student by email
    const student = await Student.findOne({ email });

    if (!student) {
      return res.status(400).json({ message: "Student not found" });
    }

    // Directly compare the entered password with the stored password (plain text)
    if (password !== student.password) {
      return res.status(400).json({ message: "Invalid password" });
    }

    // If password matches, proceed with login
    // You can add your token generation or session handling here

    res.status(200).json({ message: "Login successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
