const mongoose = require("mongoose");

const voteSchema = new mongoose.Schema({
  studentEmail: { type: String, required: true },
  position: { type: String, required: true },
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Candidate",
  },
  electionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Election",
  },
});

module.exports = mongoose.model("Vote", voteSchema);
