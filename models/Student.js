const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true, // no duplicate emails
  },
  password: {
    type: String,
    required: true,
  },
  walletAddress: {
    type: String,
    unique: true,
    sparse: true,
  },
  nonce: {
    type: String,
  },
});

module.exports = mongoose.model("Student", studentSchema);
