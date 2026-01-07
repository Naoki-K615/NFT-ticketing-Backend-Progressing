const express = require("express");
const router = express.Router();
const Election = require("../models/Election");

// Route to start a new election
router.post("/start", async (req, res) => {
  try {
    // Find the last election to increment the ID
    const lastElection = await Election.findOne().sort({ electionId: -1 });

    // Determine the new election ID
    const newElectionId = lastElection ? lastElection.electionId + 1 : 1;

    // Optional: allow frontend to send custom startDate/endDate
    const { startDate, endDate } = req.body;

    const newElection = new Election({
      electionId: newElectionId,
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : null,
    });

    await newElection.save();

    res.status(201).json({
      message: "New election started",
      electionId: newElection.electionId, // ✅ Send ID to frontend
      election: newElection,
    });
  } catch (err) {
    console.error("Error starting election:", err);
    res.status(500).json({ error: "Failed to start new election" });
  }
});

module.exports = router;
