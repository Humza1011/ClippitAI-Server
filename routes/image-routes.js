const express = require("express");
const imageController = require("../controllers/image-controller");

const router = express.Router();

// IMAGE ROUTES

// GET ALL IMAGES
router.get("/", imageController.GetImages);

// GET IMAGE BY ID
router.get("/single/:id", imageController.GetImageByID);

// CREATE NEW IMAGE
router.post("/", imageController.CreateImage);

// UPDATE IMAGE BY ID
router.patch("/:id", imageController.UpdateImage);

// DELETE IMAGE BY ID
router.delete("/:id", imageController.DeleteImage);

module.exports = router;
