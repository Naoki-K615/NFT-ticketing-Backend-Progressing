// fixVotes.js
const mongoose = require("mongoose");
const Candidate = require("./models/Candidates"); // change path if needed

// 👉 Put your correct database name here
const mongoURI = "mongodb://127.0.0.1:27017/collegeVoting";

mongoose
  .connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log("MongoDB connected");

    const candidates = await Candidate.find({ votes: { $exists: false } });

    console.log(`Fixing ${candidates.length} candidates...`);

    for (const candidate of candidates) {
      candidate.votes = 0;
      await candidate.save();
    }

    console.log("✅ Votes field added to all candidates");
    mongoose.disconnect();
  })
  .catch((err) => {
    console.error("MongoDB error:", err);
  });
