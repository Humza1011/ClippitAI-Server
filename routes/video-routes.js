const express = require("express");
const videoController = require("../controllers/video-controller");
const { UploadMultipleFilesMulter } = require("../middleware/file");

const router = express.Router();

// VIDEO ROUTES

// GET ALL VIDEOS
router.get("/", videoController.GetVideos);

// GET VIDEO BY ID
router.get("/single/:id", videoController.GetVideoByID);

// CREATE NEW VIDEOS
router.post("/", UploadMultipleFilesMulter, videoController.CreateVideos);

// UPDATE VIDEO BY ID
router.patch("/:id", videoController.UpdateVideo);

// DELETE VIDEO BY ID
router.delete("/:id", videoController.DeleteVideo);

// CREATE NEW VIDEO
router.post("/finalize", videoController.GenerateVideo);

// CREATE NEW VIDEO
router.post("/wyr/generate", videoController.GenerateWYRVideo);

module.exports = router;
