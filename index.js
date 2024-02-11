// index.js
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");

// Import routes
const userRoutes = require("./routes/user-routes");
const audioRoutes = require("./routes/audio-routes");
const imageRoutes = require("./routes/image-routes");
const projectRoutes = require("./routes/project-routes");
const videoRoutes = require("./routes/video-routes");

const app = express();

// Database connection
mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => console.log("Connected to MongoDB..."))
  .catch((err) => console.error("Could not connect to MongoDB...", err));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(cors());
app.use(morgan("tiny"));

// Routes
app.use("/user", userRoutes);
app.use("/audio", audioRoutes);
app.use("/image", imageRoutes);
app.use("/project", projectRoutes);
app.use("/video", videoRoutes);

app.get("/", (req, res) => {
  res.status(200).json({ message: "Success" });
});

// Error handling
app.use((req, res, next) => {
  res.status(404).send("Resource not found");
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.name, message: err.message });
});

// Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
