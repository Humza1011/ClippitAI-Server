const Video = require("../models/video");
const axios = require("axios");
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const cloudinary = require("cloudinary").v2;

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

// CREATE NEW VIDEOS
const CreateVideos = async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).send("No files were uploaded.");
  }

  const videoDocuments = req.files.map((file) => ({
    url: file.path,
    title: file.originalname.split(".")[0],
    type: "background",
  }));

  try {
    await Video.insertMany(videoDocuments);

    return res.status(200).json({ message: "Success" });
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

const GenerateVideo = async (req, res, next) => {
  const {
    script,
    voiceSettings,
    backgroundImage,
    backgroundAudio,
    backgroundVideo,
  } = req.body;

  try {
    // const response = await axios.post(
    //   `https://api.elevenlabs.io/v1/text-to-speech/${voiceSettings.voiceId}`,
    //   {
    //     model_id: "eleven_monolingual_v1",
    //     text: script,
    //     voice_settings: {
    //       stability: 0.5,
    //       similarity_boost: 0.75,
    //       style: 0,
    //       use_speaker_boost: true,
    //     },
    //   },
    //   {
    //     headers: {
    //       Accept: "audio/mpeg",
    //       "Content-Type": "application/json",
    //       "xi-api-key": process.env.ELEVEN_LABS_API_KEY,
    //     },
    //     responseType: "stream",
    //   }
    // );

    const audioPath = "audio.mp3";
    // response.data.pipe(fs.createWriteStream(audioPath));

    const backgroundPath = backgroundVideo
      ? backgroundVideo.url
      : backgroundImage;

    const subtitlesPath = "subtitles.srt";
    await generateSubtitlesFile(script, audioPath, subtitlesPath);

    const outputPath = "./output.mp4";

    await compileVideo({
      narrationPath: audioPath,
      backgroundPath: backgroundPath,
      musicPath: backgroundAudio ? backgroundAudio.url : null,
      subtitlesPath: subtitlesPath,
      outputPath: outputPath,
    });

    const vttPath = "subtitles.vtt";
    await convertSrtToVtt(subtitlesPath, vttPath);

    const result = await cloudinary.uploader.upload(outputPath, {
      resource_type: "video",
      type: "upload",
    });
    const result2 = await cloudinary.uploader.upload(vttPath, {
      resource_type: "raw",
      type: "upload",
    });

    // Delete the temporary file after upload
    // fs.unlinkSync(audioPath);
    fs.unlinkSync(outputPath);
    fs.unlinkSync(subtitlesPath);
    fs.unlinkSync(vttPath);
    const backgroundMediaPath = backgroundVideo
      ? "backgroundVideo.mp4"
      : "backgroundImage.png";
    fs.unlinkSync(backgroundMediaPath);

    // Respond with the URL of the uploaded file
    return res
      .status(200)
      .json({ url: result.secure_url, subtitles: result2.secure_url });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to convert text to speech",
      error: error.message,
    });
  }
};

async function compileVideo({
  narrationPath,
  backgroundPath,
  musicPath,
  subtitlesPath,
  outputPath,
}) {
  return new Promise(async (resolve, reject) => {
    let command = ffmpeg();

    // Add background
    if (backgroundPath.endsWith(".png") || backgroundPath.endsWith(".jpg")) {
      const localImagePath = "./backgroundImage.png";
      await downloadFile(backgroundPath, localImagePath);
      command
        .input(localImagePath)
        .loop()
        .inputOptions(["-framerate 25"])
        .complexFilter(
          [
            "[0:v]scale=-1:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1[fv];",
          ],
          "fv"
        );
    } else {
      const localVideoPath = "./backgroundVideo.mp4";
      await downloadFile(backgroundPath, localVideoPath);
      command.input(localVideoPath).inputOptions(["-stream_loop -1"]);
    }

    if (!musicPath) {
      command.input(narrationPath).audioFilters("volume=1.0");
    } else {
      command.input(narrationPath);
      command.input(musicPath);
      command.complexFilter(
        [
          "[1:a]volume=1.0[narration]",
          "[2:a]volume=0.2[music]",
          "[narration][music]amix=inputs=2:duration=first:dropout_transition=3[audioMix]",
        ],
        "audioMix"
      );
    }

    // Add subtitles if provided
    if (subtitlesPath) {
      command.input(subtitlesPath);
      command.outputOptions(["-c:s mov_text"]);
    }

    // Constructing dynamic -map options based on inputs
    const mapOptions = ["-map 0:v"];

    // If subtitles are provided, add them to the map options
    if (subtitlesPath) {
      const subtitleIndex = musicPath ? 3 : 2;
      mapOptions.push(`-map ${subtitleIndex}`);
    }

    // Final output options, including dynamic map options
    command
      .output(outputPath)
      .outputOptions([
        ...mapOptions,
        "-c:v libx264",
        "-profile:v baseline",
        "-level 3.0",
        "-pix_fmt yuv420p",
        "-c:a aac",
        "-shortest",
      ])
      .on("end", function () {
        console.log("Processing finished successfully");
        resolve();
      })
      .on("error", function (err) {
        console.log("Error:", err);
        reject(err);
      })
      .run();
  });
}

async function downloadFile(url, imagePath) {
  const response = await axios({
    url,
    responseType: "stream",
  });
  return new Promise((resolve, reject) => {
    response.data
      .pipe(fs.createWriteStream(imagePath))
      .on("finish", () => resolve(imagePath))
      .on("error", (e) => reject(e));
  });
}

const getAudioDuration = (audioPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(audioPath, (err, metadata) => {
      if (err) reject(err);
      else resolve(metadata.format.duration);
    });
  });
};

const generateSubtitlesFile = async (script, audioPath, subtitlesPath) => {
  const audioDuration = await getAudioDuration(audioPath); // Duration in seconds
  const sentences = script.match(/[^\.!\?]+[\.!\?]+/g) || [];
  const totalWords = script.split(" ").length;
  const wordsPerSecond = totalWords / audioDuration;
  let currentTime = 0; // Start at 0 seconds

  const srtContent = sentences
    .map((sentence, index) => {
      const sentenceWordCount = sentence.split(" ").length;
      const sentenceDuration = sentenceWordCount / wordsPerSecond;
      const startTime = formatTime(currentTime * 1000); // Convert seconds to milliseconds
      currentTime += sentenceDuration; // Increment current time by sentence duration
      const endTime = formatTime(currentTime * 1000);

      return `${index + 1}\n${startTime} --> ${endTime}\n${sentence.trim()}\n`;
    })
    .join("\n\n");

  await fs.promises.writeFile(subtitlesPath, srtContent, "utf-8");
};

const formatTime = (milliseconds) => {
  const date = new Date(milliseconds);
  return date.toISOString().substr(11, 12).replace(".", ",");
};

async function convertSrtToVtt(srtPath, vttPath) {
  try {
    let data = await fs.promises.readFile(srtPath, "utf8");
    let vttData =
      "WEBVTT\n\n" + data.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, "$1.$2");
    await fs.promises.writeFile(vttPath, vttData, "utf8");
    console.log("Conversion to VTT completed successfully");
  } catch (error) {
    console.error("Error converting SRT to VTT:", error);
  }
}

module.exports = {
  GetVideos,
  GetVideoByID,
  CreateVideos,
  UpdateVideo,
  DeleteVideo,
  GenerateVideo,
};
