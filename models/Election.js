const mongoose = require("mongoose");

const electionSchema = new mongoose.Schema({
  electionId: {
    type: Number,
    required: true,
    unique: true,
  },
  startDate: {
    type: Date,
    default: Date.now,
  },
  endDate: {
    type: Date,
  },
});

module.exports = mongoose.model("Election", electionSchema);
