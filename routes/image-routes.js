const express = require("express");
const imageController = require("../controllers/image-controller");
const { UploadMultipleFilesMulter } = require("../middleware/file");

const router = express.Router();

// IMAGE ROUTES

// GET ALL IMAGES
router.get("/", imageController.GetImages);

// GET IMAGE BY ID
router.get("/single/:id", imageController.GetImageByID);

// CREATE NEW IMAGES
router.post("/", UploadMultipleFilesMulter, imageController.CreateImages);

// DELETE IMAGE BY ID
router.delete("/:id", imageController.DeleteImage);

// GENERATE IMAGE USING AI API
router.post("/generate", imageController.GenerateImage);

module.exports = router;
