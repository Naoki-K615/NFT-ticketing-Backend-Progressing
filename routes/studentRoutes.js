const express = require("express");
const router = express.Router();
const Student = require("../models/Student");


router.post("/logup", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Check if student already exists
    const existingStudent = await Student.findOne({ email });
    if (existingStudent) {
      return res.status(400).json({ success: false, message: "Student already exists with this email" });
    }

    const student = new Student({ name, email, password });
    await student.save();
    res.status(201).json({ success: true, message: "Student registered successfully" });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ success: false, message: "Registration failed" });
  }
})
// POST /api/student/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const student = await Student.findOne({ email });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    if (student.password !== password) {
      return res.status(401).json({ message: "Invalid password" });
    }

    res.status(200).json({
      message: "Login successful",
      email: student.email,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
