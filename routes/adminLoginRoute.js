// backend/routes/adminLoginRoute.js
const express = require('express');
const Admin = require("../models/Admin.js");


const router = express.Router();
router.post("/admin/logup", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ success: false, message: "Admin already exists with this email" });
    }

    const admin = new Admin({ email, password });
    await admin.save();
    res.status(201).json({ success: true, message: "Admin registered successfully" });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ success: false, message: "Registration failed" });
  }
})
router.post("/admin/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res
        .status(404)
        .json({ success: false, message: "Admin not found" });
    }

    if (admin.password !== password) {
      return res
        .status(401)
        .json({ success: false, message: "Incorrect password" });
    }

    res.status(200).json({ success: true, message: "Login successful" });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

module.exports = router;

