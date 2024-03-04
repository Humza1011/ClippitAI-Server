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
  console.log(voiceSettings);
  try {
    const audioPath = "./assets/Temp/audio.mp3";
    await generateTTS(script, voiceSettings, audioPath);

    const backgroundPath = backgroundVideo
      ? backgroundVideo.url
      : backgroundImage;

    const subtitlesPath = "./assets/Temp/subtitles.srt";
    await generateSubtitlesFile(script, audioPath, subtitlesPath);

    const outputPath = "./assets/Temp/output.mp4";

    await compileVideo({
      narrationPath: audioPath,
      backgroundPath: backgroundPath,
      musicPath: backgroundAudio ? backgroundAudio.url : null,
      subtitlesPath: subtitlesPath,
      outputPath: outputPath,
    });

    const vttPath = "./assets/Temp/subtitles.vtt";
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
      ? "./assets/Temp/backgroundVideo.mp4"
      : "./assets/Temp/backgroundImage.png";
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

const GenerateWYRVideo = async (req, res, next) => {
  // const { voiceSettings, questions } = req.body;

  try {
    const questions = [
      [
        {
          questionText:
            "Go On a Mountain Hike, Go On a Mountain Hike, Go On a Hike",
          imageURL:
            "https://res.cloudinary.com/dqnz3rzt5/image/upload/v1709113067/ClippitAI/r6e7aof5ckoun9s1clzp.png",
        },
        {
          questionText: "Go On a Snowboarding Trip",
          imageURL:
            "https://res.cloudinary.com/dqnz3rzt5/image/upload/v1709113067/ClippitAI/rctms3bylch3fdwevrtl.png",
        },
      ],
      [
        {
          questionText: "Ride on a Snowmobile",
          imageURL:
            "https://res.cloudinary.com/dqnz3rzt5/image/upload/v1709113066/ClippitAI/o8hmsqwet4oskwhbjule.png",
        },
        {
          questionText: "Ride on a bike",
          imageURL:
            "https://res.cloudinary.com/dqnz3rzt5/image/upload/v1709113066/ClippitAI/d01bwcig3abip7nsjup6.png",
        },
      ],
      // Add more questions as needed
    ];
    const backgroundImagePath = "./assets/WYR.png";
    const outputPath = "./assets/Temp/output.mp4";

    await downloadQuestionImages(questions);

    let audioDurations = [];

    for (let i = 0; i < questions.length; i++) {
      const questionText = `${questions[i][0].questionText} Or ${questions[i][1].questionText}`;
      const audioOutputPath = `./assets/Temp/narration_${i}.mp3`;

      // Generate TTS for each question
      // await generateTTS(questionText, voiceSettings, audioOutputPath);

      // Calculate the duration of each audio file
      const audioDuration = await getAudioDuration(audioOutputPath);
      audioDurations.push(audioDuration);
    }

    await createWouldYouRatherVideo(
      questions,
      backgroundImagePath,
      audioDurations,
      outputPath
    );

    // const result = await cloudinary.uploader.upload(outputPath, {
    //   resource_type: "video",
    //   type: "upload",
    // });

    // // Delete the temporary file after upload
    // fs.unlinkSync(audioPath);
    // fs.unlinkSync(outputPath);

    // // Respond with the URL of the uploaded file
    // return res.status(200).json({ url: result.secure_url });

    return res.status(200).json({ message: "success" });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to convert text to speech",
      error: error.message,
    });
  }
};

const compileVideo = async ({
  narrationPath,
  backgroundPath,
  musicPath,
  subtitlesPath,
  outputPath,
}) => {
  return new Promise(async (resolve, reject) => {
    let command = ffmpeg();

    // Add background
    if (backgroundPath.endsWith(".png") || backgroundPath.endsWith(".jpg")) {
      const localImagePath = "./assets/Temp/backgroundImage.png";
      await downloadFile(backgroundPath, localImagePath);
      command
        .input(localImagePath)
        .loop()
        .inputOptions(["-framerate 25"])
        .complexFilter(
          [
            "[0:v]scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1[fv];",
          ],
          "fv"
        );
    } else {
      const localVideoPath = "./assets/Temp/backgroundVideo.mp4";
      await downloadFile(backgroundPath, localVideoPath);
      command
        .input(localVideoPath)
        .inputOptions(["-stream_loop -1"])
        .complexFilter(
          [
            "[0:v]scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1[fv];",
          ],
          "fv"
        );
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

    if (!musicPath) {
      mapOptions.push("-map 1:a");
    }

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
        "-s 1080x1920", // Force Vertical Resolution (Aspect Ratio 9:16)
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
};

const createWouldYouRatherVideo = async (
  questions,
  backgroundImagePath,
  audioDurations,
  outputPath
) => {
  return new Promise(async (resolve, reject) => {
    let command = ffmpeg();
    const questionPause = 5;
    // const totalDuration = questions.length * questionPause;
    const totalDuration =
      audioDurations.reduce((total, duration) => total + duration, 0) +
      questions.length * questionPause;
    console.log("Total Duration: ", totalDuration);

    // Add background image
    command
      .input(backgroundImagePath)
      .inputOptions([`-t ${totalDuration}`, `-loop 1`, `-framerate 25`]);

    // Filter for background image
    let filterComplex = ["[0:v]scale=1080:1920,setsar=1[fv];"];

    // Add question images and overlay them on the background
    let inputIndex = 1;
    let startTime = 0;
    questions.forEach((question, index) => {
      // const startTime = index * questionPause;
      // const duration = questionPause;
      const duration = audioDurations[index];
      const endTime = startTime + duration + questionPause;

      question.forEach((part, partIndex) => {
        const localImagePath = `./assets/Temp/question_${index}_part_${partIndex}.png`;
        const yPosImage = partIndex === 0 ? "H/6" : "H/1.45";
        let yPosText;
        if (part.questionText.length <= 30) {
          yPosText = partIndex === 0 ? "H/6 - 130" : "H/1.45 - 130";
        } else {
          yPosText = partIndex === 0 ? "H/6 - 180" : "H/1.45 - 180";
        }

        // Add Line Breaks for text wrapping
        const formattedText = splitTextIntoLines(part.questionText, 30);

        // Add input for each image
        command
          .input(localImagePath)
          .inputOptions([`-t ${duration}`, `-loop 1`]);

        // Scale the image and overlay it on the background
        filterComplex.push(
          `[${inputIndex}:v]scale=500:500[img${index}p${partIndex}];`,
          `[fv][img${index}p${partIndex}]overlay=x=(W-w)/2:y=${yPosImage}:enable='between(t,${startTime},${endTime})'[fv];`
        );

        // Add the drawtext filter to the filter complex
        filterComplex.push(
          `[fv]drawtext=text='${formattedText}':fontfile='./assets/Font/Roboto-Medium.ttf':fontsize=72:fontcolor=white:shadowcolor=black:shadowx=2:shadowy=2:x=(W-tw)/2:y=${yPosText}:enable='between(t,${startTime},${endTime})'[fv];`
        );

        inputIndex++; // Increment the input index for the next image
      });

      // Increment the start time for the next question by the duration plus a 5-second pause
      startTime = endTime;

      // // Add the narration audio as an input
      // const narrationAudioPath = `./assets/Temp/narration_${index}.mp3`;
      // command
      //   .input(narrationAudioPath)
      //   .inputOptions(["-ss", startTime.toString(), "-t", duration.toString()]);
    });

    // Concatenate all filter complex strings and add to command
    const complexFilterString = filterComplex.join("");
    command.complexFilter(complexFilterString, "fv");

    // Set output options
    command
      .output(outputPath)
      .outputOptions([
        "-c:v libx264",
        "-profile:v baseline",
        "-level 3.0",
        "-pix_fmt yuv420p",
        "-shortest",
      ])
      .on("start", (commandLine) => {
        console.log("Spawned FFmpeg with command: " + commandLine);
      })
      .on("end", () => {
        console.log("Processing finished successfully");
        resolve();
      })
      .on("error", (err, stdout, stderr) => {
        console.log("Error:", err);
        console.log("ffmpeg stdout:", stdout);
        console.log("ffmpeg stderr:", stderr);
        reject(err);
      });

    // Run the FFmpeg command
    command.run();
  });
};

const generateTTS = async (text, voiceSettings, outputPath) => {
  try {
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceSettings.voiceId}`,
      {
        model_id: "eleven_monolingual_v1",
        text: text,
        voice_settings: {
          stability: voiceSettings.stability / 100 || 0.5,
          similarity_boost: 0.75,
          style: voiceSettings.style || 0,
          use_speaker_boost: true,
        },
      },
      {
        headers: {
          Accept: "audio/mpeg",
          "Content-Type": "application/json",
          "xi-api-key": process.env.ELEVEN_LABS_API_KEY,
        },
        responseType: "stream",
      }
    );

    response.data.pipe(fs.createWriteStream(outputPath));
  } catch (error) {
    console.log(error);
  }
};

const downloadFile = async (url, imagePath) => {
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
};

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

const convertSrtToVtt = async (srtPath, vttPath) => {
  try {
    let data = await fs.promises.readFile(srtPath, "utf8");
    let vttData =
      "WEBVTT\n\n" + data.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, "$1.$2");
    await fs.promises.writeFile(vttPath, vttData, "utf8");
    console.log("Conversion to VTT completed successfully");
  } catch (error) {
    console.error("Error converting SRT to VTT:", error);
  }
};

const downloadQuestionImages = async (questions) => {
  const downloadTasks = questions.flatMap((question, index) =>
    question.map((part, partIndex) => ({
      url: part.imageURL,
      path: `./assets/Temp/question_${index}_part_${partIndex}.png`,
    }))
  );
  const downloadPromises = downloadTasks.map((file) =>
    downloadFile(file.url, file.path)
  );
  return Promise.all(downloadPromises);
};

const splitTextIntoLines = (text, maxLineLength) => {
  const words = text.split(" ");
  let lines = [];
  let currentLine = "";

  words.forEach((word) => {
    if ((currentLine + word).length > maxLineLength) {
      lines.push(currentLine.trim());
      currentLine = word + " ";
    } else {
      currentLine += word + " ";
    }
  });

  // Add the last line
  lines.push(currentLine.trim());

  return lines.join("\n");
};

module.exports = {
  GetVideos,
  GetVideoByID,
  CreateVideos,
  UpdateVideo,
  DeleteVideo,
  GenerateVideo,
  GenerateWYRVideo,
};
