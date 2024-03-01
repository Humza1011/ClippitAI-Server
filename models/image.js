const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema({
  title: { type: String },
  url: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Image", imageSchema);
