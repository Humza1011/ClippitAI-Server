const express = require("express");
const audioController = require("../controllers/audio-controller");

const router = express.Router();

// AUDIO ROUTES

// GET ALL AUDIOS
router.get("/", audioController.GetAudios);

// GET AUDIO BY ID
router.get("/single/:id", audioController.GetAudioByID);

// CREATE NEW AUDIO
router.post("/", audioController.CreateAudio);

// UPDATE AUDIO BY ID
router.patch("/:id", audioController.UpdateAudio);

// DELETE AUDIO BY ID
router.delete("/:id", audioController.DeleteAudio);

module.exports = router;
