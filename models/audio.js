const mongoose = require("mongoose");

const audioSchema = new mongoose.Schema({
  title: { type: String },
  url: { type: String, required: true },
  // type: { type: String, enum: ["speech", "music"], required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Audio", audioSchema);
