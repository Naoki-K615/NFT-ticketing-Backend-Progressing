// Example Mongoose model (if using MongoDB)
const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({
  filePath: String,
  uploadedAt: { type: Date, default: Date.now },
});

const File = mongoose.model("File", fileSchema);

// Inside the upload route after file upload
const newFile = new File({
  filePath: `/uploads/${req.file.filename}`,
});

newFile
  .save()
  .then(() => res.status(200).json({ message: "File uploaded and saved" }))
  .catch((err) => res.status(500).json({ message: "Error saving file" }));
