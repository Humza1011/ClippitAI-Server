const mongoose = require("mongoose");

const videoSchema = new mongoose.Schema({
  title: { type: String },
  url: { type: String, required: true },
  type: { type: String, enum: ["background", "project"], required: true },
  description: String,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  // audioId: { type: mongoose.Schema.Types.ObjectId, ref: "Audio" },
  // imageId: { type: mongoose.Schema.Types.ObjectId, ref: "Image" },
  // backgroundMusicId: { type: mongoose.Schema.Types.ObjectId, ref: "Audio" },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Video", videoSchema);
