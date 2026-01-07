const express = require("express");
const router = express.Router();
const Vote = require("../models/Vote");
const Candidate = require("../models/Candidates");
const Student = require("../models/Student");

router.post("/", async (req, res) => {
  const { candidateId, studentEmail } = req.body;

  try {
    // 1. Find the candidate by ID
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({ error: "Candidate not found." });
    }

    const { position, electionId } = candidate;

    // 2. Find the student by email
    const student = await Student.findOne({ email: studentEmail });
    if (!student) {
      return res.status(404).json({ error: "Student not found." });
    }

    // 3. Check if student has already voted for this position in this election
    const hasVoted = student.votes?.some(
      (vote) => vote.position === position && vote.electionId === electionId
    );

    if (hasVoted) {
      return res.status(400).json({
        error: "You have already voted for this position in this election.",
      });
    }

    // 4. Record the vote in Vote collection (optional but useful for audit)
    await Vote.create({ studentEmail, position, candidateId, electionId });

    // 5. Increment the candidate's vote count
    await Candidate.findByIdAndUpdate(candidateId, { $inc: { voteCount: 1 } });

    // 6. Save vote info in student record
    if (!student.votes) student.votes = [];
    student.votes.push({ position, electionId });
    await student.save();

    res.status(200).json({ message: "Vote cast successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
