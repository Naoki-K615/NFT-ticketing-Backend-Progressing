const express = require("express");
const router = express.Router();
const Candidate = require("../models/Candidates");
const Election = require("../models/Election");

// Route to add candidates
router.post("/add", async (req, res) => {
  try {
    const { candidates } = req.body;

    if (!candidates || typeof candidates !== "object") {
      return res.status(400).json({ error: "Invalid candidates data" });
    }

    // Fetch the latest election
    // Fetch the latest election
    const currentElection = await Election.findOne().sort({ electionId: -1 });
    if (!currentElection) {
      return res.status(400).json({
        error: "No active election found. Please start an election first.",
      });
    }

    // 🔧 Correct line: use ObjectId
    const electionId = currentElection._id;

    const allNewCandidates = [];

    for (const position in candidates) {
      const positionCandidates = candidates[position];

      if (!Array.isArray(positionCandidates)) continue;

      for (const candidate of positionCandidates) {
        const { name, image } = candidate;

        if (!name || !image) {
          return res.status(400).json({
            error: `Missing name or image for a candidate under position: ${position}`,
          });
        }

        const newCandidate = new Candidate({
          position,
          name,
          image,
          voteCount: 0,
          electionId,
        });

        await newCandidate.save();
        allNewCandidates.push(newCandidate);
      }
    }

    res.status(201).json({
      message: "All candidates added successfully",
      candidates: allNewCandidates,
    });
  } catch (err) {
    console.error("Error adding candidates:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

// Route to get grouped candidates with vote counts
router.get("/grouped", async (req, res) => {
  try {
    const candidates = await Candidate.find().select(
      "name image position voteCount"
    );

    const grouped = {};
    candidates.forEach((candidate) => {
      const pos = candidate.position;
      if (!grouped[pos]) {
        grouped[pos] = [];
      }
      grouped[pos].push({
        _id: candidate._id,
        name: candidate.name,
        image: candidate.image,
        votes: candidate.voteCount,
      });
    });

    res.status(200).json(grouped);
  } catch (error) {
    console.error("Error adding candidates:", error);
    res
      .status(500)
      .json({ error: "Error adding candidates", details: error.message });
  }
});

// DELETE route to remove a candidate by ID
router.delete("/:id", async (req, res) => {
  try {
    const candidateId = req.params.id;

    const deletedCandidate = await Candidate.findByIdAndDelete(candidateId);

    if (!deletedCandidate) {
      return res.status(404).json({ error: "Candidate not found" });
    }

    res.status(200).json({ message: "Candidate deleted successfully" });
  } catch (err) {
    console.error("Error deleting candidate:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
