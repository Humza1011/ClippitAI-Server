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

// CREATE NEW AUDIOS
const CreateAudios = async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).send("No files were uploaded.");
  }

  const audioDocuments = req.files.map((file) => ({
    url: file.path,
    title: file.originalname.split(".")[0],
  }));

  try {
    await Audio.insertMany(audioDocuments);

    return res.status(200).json({ message: "Success" });
  } catch (err) {
    next(err);
  }
};

// UPDATE VIDEO
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
  CreateAudios,
  DeleteAudio,
  UpdateAudio,
};
