const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  walletAddress: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
  },
  votes: [{
    position: String,
    electionId: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

studentSchema.index({ walletAddress: 1 });

module.exports = mongoose.model("Student", studentSchema);
