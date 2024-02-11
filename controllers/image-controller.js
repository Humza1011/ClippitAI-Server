const Image = require("../models/image");

//        ********** FUNCTIONS ***********

// GET ALL IMAGES
const GetImages = async (req, res, next) => {
  console.log("Get all images");
  try {
    const image = await Image.find();
    return res.status(200).send(image);
  } catch (err) {
    next(err);
  }
};

// GET SINGLE IMAGE
const GetImageByID = async (req, res, next) => {
  try {
    const image = await Image.findById(req.params.id);
    return res.status(200).send(image);
  } catch (err) {
    next(err);
  }
};

// CREATE NEW IMAGE
const CreateImage = async (req, res, next) => {
  const image = new Image(req.body);
  try {
    await image.save();
    return res.status(200).json(image);
  } catch (err) {
    next(err);
  }
};

// UPDATE IMAGE
const UpdateImage = async (req, res, next) => {
  try {
    const image = await Image.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    return res.status(200).json(image);
  } catch (err) {
    next(err);
  }
};

// DELETE IMAGE
const DeleteImage = async (req, res, next) => {
  try {
    const image = await Image.findByIdAndDelete(req.params.id);
    return res.status(200).json(image);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  GetImages,
  GetImageByID,
  CreateImage,
  UpdateImage,
  DeleteImage,
};
