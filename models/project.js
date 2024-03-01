const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
  title: { type: String },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  videos: [{ type: mongoose.Schema.Types.ObjectId, ref: "Video" }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Project", projectSchema);
