const express = require("express");
const videoController = require("../controllers/video-controller");
const { UploadMultipleFilesMulter } = require("../middleware/file");

const router = express.Router();

// VIDEO ROUTES

// GET ALL VIDEOS
router.get("/", videoController.GetVideos);

// GET VIDEO BY ID
router.get("/user/:id", videoController.GetUserVideos);

// GET VIDEO BY ID
router.get("/:id", videoController.GetVideoByID);

// CREATE NEW VIDEOS
router.post("/", UploadMultipleFilesMulter, videoController.CreateVideos);

// UPDATE VIDEO BY ID
router.patch("/:id", videoController.UpdateVideo);

// DELETE VIDEO BY ID
router.delete("/:id", videoController.DeleteVideo);

// CREATE NEW GPT STORY STYLE VIDEO
router.post("/gpt-story", videoController.GenerateGPTStoryVideo);

// CREATE NEW WOULD YOU RATHER STYLE VIDEO
router.post("/would-you-rather", videoController.GenerateWYRVideo);

module.exports = router;
