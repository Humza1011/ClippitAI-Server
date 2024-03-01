const Image = require("../models/image");
const Replicate = require("replicate");

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

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

// CREATE NEW IMAGES
const CreateImages = async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).send("No files were uploaded.");
  }

  const imageDocuments = req.files.map((file) => ({
    url: file.path,
  }));

  try {
    await Image.insertMany(imageDocuments);

    return res.status(200).json({ message: "Success" });
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

const GenerateImage = async (req, res) => {
  const prompt = req.body.prompt;

  try {
    // const output = await replicate.run(
    //   "stability-ai/stable-diffusion:ac732df83cea7fff18b8472768c88ad041fa750ff7682a21affe81863cbe77e4",
    //   {
    //     input: {
    //       width: 768,
    //       height: 768,
    //       prompt: prompt,
    //       scheduler: "K_EULER_ANCESTRAL",
    //       num_outputs: 2,
    //       guidance_scale: 10,
    //       num_inference_steps: 50,
    //     },
    //   }
    // );
    const output = await replicate.run(
      "lucataco/sdxl-lightning-4step:727e49a643e999d602a896c774a0658ffefea21465756a6ce24b7ea4165eba6a",
      {
        input: {
          width: 1024,
          height: 1024,
          prompt: prompt,
          scheduler: "K_EULER",
          num_outputs: 4,
          guidance_scale: 0,
          negative_prompt: "worst quality, low quality",
          num_inference_steps: 4,
        },
      }
    );
    console.log(output);
    res.status(200).json(output);
  } catch (error) {
    console.error("Error generating image:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate image",
      error: error.message,
    });
  }
};

module.exports = {
  GetImages,
  GetImageByID,
  CreateImages,
  DeleteImage,
  GenerateImage,
};
