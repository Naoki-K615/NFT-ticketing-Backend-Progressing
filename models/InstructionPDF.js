// models/InstructionPDF.js
const mongoose = require("mongoose");

const instructionPDFSchema = new mongoose.Schema({
  filePath: {
    type: String,
    required: true,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("InstructionPDF", instructionPDFSchema);
