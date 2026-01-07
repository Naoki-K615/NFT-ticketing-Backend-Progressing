const Candidate = require("../models/Candidate.js");

// Save candidates for each position
// Save candidates for each position
const addCandidates = async (req, res) => {
  try {
    const { candidates } = req.body;

    for (const position in candidates) {
      const candidateList = candidates[position];
      for (const candidate of candidateList) {
        const newCandidate = new Candidate({
          position,
          name: candidate.name,
          image: candidate.image,
          voteCount: 0, // ✅ Explicitly add this
        });
        await newCandidate.save();
      }
    }

    res.status(201).json({ message: "Candidates saved successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save candidates." });
  }
};

// Get all candidates
const getCandidates = async (req, res) => {
  try {
    const allCandidates = await Candidate.find();
    res.status(200).json(allCandidates);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch candidates." });
  }
};

const getGroupedCandidates = async (req, res) => {
  try {
    // Include voteCount in the selected fields
    const candidates = await Candidate.find().select(
      "name position image voteCount"
    );

    const grouped = {};
    candidates.forEach((candidate) => {
      const pos = candidate.position;
      if (!grouped[pos]) {
        grouped[pos] = [];
      }
      grouped[pos].push(candidate);
    });

    res.status(200).json(grouped);
  } catch (error) {
    console.error("Error fetching candidates:", error);
    res.status(500).json({ error: "Failed to fetch candidates" });
  }
};

// Export both functions
module.exports = {
  addCandidates,
  getCandidates,
  getGroupedCandidates,
};
