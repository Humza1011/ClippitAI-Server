// index.js
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const cloudinary = require("cloudinary").v2;

// Import routes
const userRoutes = require("./routes/user-routes");
const audioRoutes = require("./routes/audio-routes");
const imageRoutes = require("./routes/image-routes");
const projectRoutes = require("./routes/project-routes");
const videoRoutes = require("./routes/video-routes");
const {
  generateVideoScript,
  generateWYRQuestions,
} = require("./middleware/scriptGeneration");
const {
  UploadMultipleFilesMulter,
  UploadMultipleFiles,
  UploadFileMulter,
  UploadFile,
} = require("./middleware/file");

const app = express();

// CONFIGURE CLOUDINARY
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Database connection
mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => console.log("Connected to MongoDB..."))
  .catch((err) => console.error("Could not connect to MongoDB...", err));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
// app.use(cors());
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN,
    // credentials: true,
  })
);
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

app.post("/script/generate", generateVideoScript);
app.get("/wyr-questions/generate", generateWYRQuestions);

app.post(
  "/file/upload/multiple",
  UploadMultipleFilesMulter,
  UploadMultipleFiles
);
app.post("/file/upload", UploadFileMulter, UploadFile);

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
const server = app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);
server.setTimeout(6000000);