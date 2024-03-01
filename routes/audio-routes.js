const express = require("express");
const audioController = require("../controllers/audio-controller");
const { UploadMultipleFilesMulter } = require("../middleware/file");

const router = express.Router();

// AUDIO ROUTES

// GET ALL AUDIOS
router.get("/", audioController.GetAudios);

// GET AUDIO BY ID
router.get("/single/:id", audioController.GetAudioByID);

// CREATE NEW AUDIOS
router.post("/", UploadMultipleFilesMulter, audioController.CreateAudios);

// UPDATE AUDIO BY ID
router.patch("/:id", audioController.UpdateAudio);

// DELETE AUDIO BY ID
router.delete("/:id", audioController.DeleteAudio);

module.exports = router;
