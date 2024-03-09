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
  const { prompt, count } = req.body;

  try {
    const output = await replicate.run(
      "lucataco/sdxl-lightning-4step:727e49a643e999d602a896c774a0658ffefea21465756a6ce24b7ea4165eba6a",
      {
        input: {
          width: 1024,
          height: 1024,
          prompt: prompt,
          scheduler: "K_EULER",
          num_outputs: count || 4,
          guidance_scale: 0,
          negative_prompt:
            "out of frame, lowres, text, error, cropped, worst quality, low quality, jpeg artifacts, ugly, duplicate, morbid, mutilated, out of frame, extra fingers, mutated hands, poorly drawn hands, poorly drawn face, mutation, deformed, blurry, dehydrated, bad anatomy, bad proportions, extra limbs, cloned face, disfigured, gross proportions, malformed limbs, missing arms, missing legs, extra arms, extra legs, fused fingers, too many fingers, long neck, username, watermark, signature",
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
