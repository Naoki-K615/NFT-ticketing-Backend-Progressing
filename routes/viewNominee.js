const express = require("express");
const router = express.Router();
const Nominee = require("../models/Nominee");

// Sample route
router.get("/all", async (req, res) => {
  try {
    const nominees = await Nominee.find();
    res.status(200).json(nominees);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
});

module.exports = router;
