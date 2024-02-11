const Audio = require("../models/audio");

//        ********** FUNCTIONS ***********

// GET ALL AUDIOS
const GetAudios = async (req, res, next) => {
  console.log("Get all audios");
  try {
    const audio = await Audio.find();
    return res.status(200).send(audio);
  } catch (err) {
    next(err);
  }
};

// GET SINGLE AUDIO
const GetAudioByID = async (req, res, next) => {
  try {
    const audio = await Audio.findById(req.params.id);
    return res.status(200).send(audio);
  } catch (err) {
    next(err);
  }
};

// CREATE NEW AUDIO
const CreateAudio = async (req, res, next) => {
  const audio = new Audio(req.body);
  try {
    await audio.save();
    return res.status(200).json(audio);
  } catch (err) {
    next(err);
  }
};

// UPDATE AUDIO
const UpdateAudio = async (req, res, next) => {
  try {
    const audio = await Audio.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    return res.status(200).json(audio);
  } catch (err) {
    next(err);
  }
};

// DELETE AUDIO
const DeleteAudio = async (req, res, next) => {
  try {
    const audio = await Audio.findByIdAndDelete(req.params.id);
    return res.status(200).json(audio);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  GetAudios,
  GetAudioByID,
  CreateAudio,
  UpdateAudio,
  DeleteAudio,
};
