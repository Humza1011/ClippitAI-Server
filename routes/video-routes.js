const express = require("express");
const videoController = require("../controllers/video-controller");

const router = express.Router();

// VIDEO ROUTES

// GET ALL VIDEOS
router.get("/", videoController.GetVideos);

// GET VIDEO BY ID
router.get("/single/:id", videoController.GetVideoByID);

// CREATE NEW VIDEO
router.post("/", videoController.CreateVideo);

// UPDATE VIDEO BY ID
router.patch("/:id", videoController.UpdateVideo);

// DELETE VIDEO BY ID
router.delete("/:id", videoController.DeleteVideo);

module.exports = router;
