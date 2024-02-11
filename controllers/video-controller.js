const Video = require("../models/video");

//        ********** FUNCTIONS ***********

// GET ALL VIDEOS
const GetVideos = async (req, res, next) => {
  console.log("Get all videos");
  try {
    const video = await Video.find();
    return res.status(200).send(video);
  } catch (err) {
    next(err);
  }
};

// GET SINGLE VIDEO
const GetVideoByID = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id);
    return res.status(200).send(video);
  } catch (err) {
    next(err);
  }
};

// CREATE NEW VIDEO
const CreateVideo = async (req, res, next) => {
  const video = new Video(req.body);
  try {
    await video.save();
    return res.status(200).json(video);
  } catch (err) {
    next(err);
  }
};

// UPDATE VIDEO
const UpdateVideo = async (req, res, next) => {
  try {
    const video = await Video.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    return res.status(200).json(video);
  } catch (err) {
    next(err);
  }
};

// DELETE VIDEO
const DeleteVideo = async (req, res, next) => {
  try {
    const video = await Video.findByIdAndDelete(req.params.id);
    return res.status(200).json(video);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  GetVideos,
  GetVideoByID,
  CreateVideo,
  UpdateVideo,
  DeleteVideo,
};
