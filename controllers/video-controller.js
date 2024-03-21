const Video = require("../models/video");
const axios = require("axios");
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const cloudinary = require("cloudinary").v2;
const { v4: uuidv4 } = require("uuid");

//        ********** FUNCTIONS ***********

// GET ALL VIDEOS
const GetVideos = async (req, res, next) => {
  console.log("Get all videos");
  try {
    const query = {};
    if (req.query.type) {
      query.type = req.query.type;
    }

    const videos = await Video.find(query);
    return res.status(200).send(videos);
  } catch (err) {
    next(err);
  }
};

// GET ALL VIDEOS FOR A SINGLE USER
const GetUserVideos = async (req, res, next) => {
  console.log("Get all user videos");
  try {
    const videos = await Video.find({ userId: req.params.id, type: "project" });
    return res.status(200).send(videos);
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

const GenerateGPTStoryVideo = async (req, res, next) => {
  const { images, voiceSettings, backgroundAudio, backgroundVideo, userId } =
    req.body;

  console.log(req.body);

  try {
    const backgroundVideoPath = "./assets/Temp/backgroundVideo.mp4";
    await downloadFile(
      backgroundVideo.url,
      "./assets/Temp/backgroundVideo.mp4"
    );

    await Promise.all(
      images.map((image, index) =>
        downloadFile(image.url, `./assets/Temp/image_${index}.png`)
      )
    );

    let promptAudioDurations = [];
    let commentAudioDurations = [];
    for (let i = 0; i < images.length; i++) {
      const promptAudioPath = `./assets/Temp/prompt_narration_${i}.mp3`;
      const commentAudioPath = `./assets/Temp/comment_narration_${i}.mp3`;
      await generateTTS(images[i].prompt, voiceSettings, promptAudioPath);
      await generateTTS(images[i].comment, voiceSettings, commentAudioPath);
      const promptAudioDuration = await getAudioDuration(promptAudioPath);
      const commentAudioDuration = await getAudioDuration(commentAudioPath);
      promptAudioDurations.push(promptAudioDuration);
      commentAudioDurations.push(commentAudioDuration);
    }

    const outputPath = "./assets/Temp/output.mp4";

    await compileGPTStoryVideo({
      images,
      backgroundVideoPath,
      backgroundAudioPath: backgroundAudio ? backgroundAudio.url : "",
      promptAudioDurations,
      commentAudioDurations,
      outputPath,
    });

    const result = await cloudinary.uploader.upload(outputPath, {
      resource_type: "video",
      type: "upload",
    });

    const video = new Video({
      url: result.secure_url,
      title: `Video ${uuidv4()}`,
      type: "project",
      userId: userId,
    });
    await video.save();

    // Delete the temporary files after upload
    fs.unlinkSync(outputPath);
    fs.unlinkSync(backgroundVideoPath);
    for (let i = 0; i < images.length; i++) {
      const promptAudioPath = `./assets/Temp/prompt_narration_${i}.mp3`;
      const commentAudioPath = `./assets/Temp/comment_narration_${i}.mp3`;
      const imagePath = `./assets/Temp/image_${i}.png`;
      fs.unlinkSync(promptAudioPath);
      fs.unlinkSync(commentAudioPath);
      fs.unlinkSync(imagePath);
    }

    // Respond with the URL of the uploaded file
    return res.status(200).json({
      url: result.secure_url,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to create gpt story video",
      error: error.message,
    });
  }
};

const GenerateWYRVideo = async (req, res, next) => {
  const { voiceSettings, questions, backgroundAudio, userId } = req.body;

  try {
    const backgroundImagePath = "./assets/WYR.png";
    const outputPath = "./assets/Temp/output.mp4";
    const soundEffectPath = "./assets/ting.mp3";
    const soundEffectDuration = await getAudioDuration(soundEffectPath);
    const soundEffect = {
      path: soundEffectPath,
      duration: soundEffectDuration,
    };

    await downloadQuestionImages(questions);

    let audioDurations = [];

    for (let i = 0; i < questions.length; i++) {
      const questionText = `${questions[i][0].questionText} Or ${questions[i][1].questionText}`;
      const audioOutputPath = `./assets/Temp/narration_${i}.mp3`;

      // Generate TTS for each question
      await generateTTS(questionText, voiceSettings, audioOutputPath);

      // Calculate the duration of each audio file
      const audioDuration = await getAudioDuration(audioOutputPath);
      audioDurations.push(audioDuration);
    }

    await createWouldYouRatherVideo({
      questions,
      backgroundImagePath,
      audioDurations,
      soundEffect,
      backgroundAudio: backgroundAudio ? backgroundAudio.url : "",
      outputPath,
    });

    const result = await cloudinary.uploader.upload(outputPath, {
      resource_type: "video",
      type: "upload",
    });

    const video = new Video({
      url: result.secure_url,
      title: `Video ${uuidv4()}`,
      type: "project",
      userId: userId,
    });
    await video.save();

    // Delete the temporary files after upload
    fs.unlinkSync(outputPath);
    for (let i = 0; i < questions.length; i++) {
      const audioPath = `./assets/Temp/narration_${i}.mp3`;
      const imagePath1 = `./assets/Temp/question_${i}_part_0.png`;
      const imagePath2 = `./assets/Temp/question_${i}_part_1.png`;
      fs.unlinkSync(audioPath);
      fs.unlinkSync(imagePath1);
      fs.unlinkSync(imagePath2);
    }

    // Respond with the URL of the uploaded file
    return res.status(200).json({ url: result.secure_url });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to convert text to speech",
      error: error.message,
    });
  }
};

const compileGPTStoryVideo = async ({
  images,
  backgroundVideoPath,
  backgroundAudioPath,
  promptAudioDurations,
  commentAudioDurations,
  outputPath,
}) => {
  return new Promise(async (resolve, reject) => {
    let command = ffmpeg();

    const afterPromptPause = 1;
    const afterCommentPause = 1;
    const totalDuration =
      promptAudioDurations.reduce((total, duration) => total + duration, 0) +
      commentAudioDurations.reduce((total, duration) => total + duration, 0) +
      images.length * (afterCommentPause + afterPromptPause) -
      afterCommentPause;
    console.log("Total Duration: ", totalDuration);

    const videoHeight = 1920;
    const videoWidth = 1080;
    const backgroundVideoHeight = videoHeight / 2;

    command
      .input(backgroundVideoPath)
      .inputOptions([`-t ${totalDuration}`, "-stream_loop -1"]);

    // Filter for background video (bottom half)
    let filterComplex = [
      `[0:v]scale=${videoWidth}:${backgroundVideoHeight}[bg];`,
      `[bg]pad=${videoWidth}:${videoHeight}:(ow-iw)/2:${backgroundVideoHeight},setsar=1[fv];`,
    ];

    if (backgroundAudioPath) {
      command
        .input(backgroundAudioPath)
        .inputOptions([`-t ${totalDuration}`, "-stream_loop -1"]);
      filterComplex.push(`[1:a]volume=0.1[audioBg];`);
    }

    // Add question images and overlay them on the background
    let inputIndex = backgroundAudioPath ? 2 : 1;
    let startTime = 0;
    images.forEach((image, index) => {
      const promptDuration = promptAudioDurations[index] + afterPromptPause;
      const commentDuration = commentAudioDurations[index] + afterCommentPause;
      const duration = promptDuration + commentDuration;
      const promptEndTime = startTime + promptDuration;
      const endTime = startTime + duration;

      // Add Prompt Circle Image
      const yPosChatCircle = "H/4 - 44";
      command
        .input("./assets/chatCircle.png")
        .inputOptions([`-t ${promptDuration}`, `-loop 1`]);
      filterComplex.push(
        `[${inputIndex}:v]scale=50:50[img${index}];`,
        `[fv][img${index}]overlay=x=200:y=${yPosChatCircle}:enable='between(t,${startTime},${promptEndTime})'[fv];`
      );
      inputIndex++;

      // Add the Generated Image
      const yPosImage = "160";
      const localImagePath = `./assets/Temp/image_${index}.png`;
      command
        .input(localImagePath)
        .inputOptions([`-t ${commentDuration}`, `-loop 1`]);
      filterComplex.push(
        `[${inputIndex}:v]scale=650:650[img${index}];`,
        `[fv][img${index}]overlay=x=(W-w)/2:y=${yPosImage}:enable='between(t,${promptEndTime},${endTime})'[fv];`
      );
      inputIndex++;

      const yPosPromptHeadingText = "H/4 - 30";
      const yPosPromptText = "H/4 + 20";
      const yPosCommentText =
        image.comment.length <= 48 ? "H/2 - 30" : "H/2 - 80";

      const formattedPromptText = splitTextIntoLines(image.prompt, 42);
      const formattedCommentText = splitTextIntoLines(image.comment, 48);

      filterComplex.push(
        `[fv]drawtext=text='You':fontfile='./assets/Font/Roboto-Medium.ttf':fontsize=32:fontcolor=white:x=280:y=${yPosPromptHeadingText}:enable='between(t,${startTime},${promptEndTime})'[fv];`
      );
      filterComplex.push(
        `[fv]drawtext=text='${formattedPromptText}':fontfile='./assets/Font/Roboto-Medium.ttf':fontsize=34:fontcolor=white:x=280:y=${yPosPromptText}:enable='between(t,${startTime},${promptEndTime})'[fv];`
      );

      filterComplex.push(
        `[fv]drawtext=text='${formattedCommentText}':fontfile='./assets/Font/Roboto-Medium.ttf':fontsize=48:fontcolor=white:box=1:boxcolor=black@0.4:boxborderw=10:x=(W-tw)/2:y=${yPosCommentText}:enable='between(t,${promptEndTime},${endTime})'[fv];`
      );

      // Add Prompt Narration Audio
      const promptNarrationPath = `./assets/Temp/prompt_narration_${index}.mp3`;
      command.input(promptNarrationPath);
      const delayPrompt = afterCommentPause * 1000;
      if (index === 0) {
        filterComplex.push(`[${inputIndex}:a]adelay=0|0[pa${index}];`);
      } else {
        filterComplex.push(
          `[${inputIndex}:a]adelay=${delayPrompt}|${delayPrompt}[pa${index}];`
        );
      }

      inputIndex++;

      // Add Comment Narration Audio
      const commentNarrationPath = `./assets/Temp/comment_narration_${index}.mp3`;
      command.input(commentNarrationPath);
      const delayComment = afterPromptPause * 1000;
      filterComplex.push(
        `[${inputIndex}:a]adelay=${delayComment}|${delayComment}[ca${index}];`
      );

      inputIndex++;

      startTime = endTime;
    });

    const audioTracks = images.reduce((acc, _, index) => {
      return acc + `[pa${index}][ca${index}]`;
    }, "");
    filterComplex.push(
      `${audioTracks}concat=n=${images.length * 2}:v=0:a=1[outa];`
    );

    const dynamicMapOptions = ["-map [fv]"];

    if (backgroundAudioPath) {
      filterComplex.push(
        `[outa][audioBg]amix=inputs=2:duration=first:dropout_transition=3[audioMix]`
      );
      dynamicMapOptions.push("-map [audioMix]");
    } else {
      dynamicMapOptions.push("-map [outa]");
    }

    // Concatenate all filter complex strings and add to command
    const complexFilterString = filterComplex.join("");
    command.complexFilter(complexFilterString);

    // Set output options
    command
      .output(outputPath)
      .outputOptions([
        ...dynamicMapOptions,
        "-profile:v baseline",
        "-level 3.0",
        "-pix_fmt yuv420p",
        "-s 1080x1920", // Force Vertical Resolution (Aspect Ratio 9:16)
        "-v verbose",
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

const createWouldYouRatherVideo = async ({
  questions,
  backgroundImagePath,
  audioDurations,
  soundEffect,
  backgroundAudio,
  outputPath,
}) => {
  return new Promise(async (resolve, reject) => {
    let command = ffmpeg();
    const afterQuestionPause = 1;
    const afterAnswerPause = 2;
    const totalDuration =
      audioDurations.reduce((total, duration) => total + duration, 0) +
      questions.length * soundEffect.duration +
      questions.length * (afterQuestionPause + afterAnswerPause);
    console.log("Total Duration: ", totalDuration);

    // Add background image
    command
      .input(backgroundImagePath)
      .inputOptions([`-t ${totalDuration}`, `-loop 1`, `-framerate 25`]);

    // Filter for background image
    let filterComplex = ["[0:v]scale=1080:1920,setsar=1[fv];"];

    console.log(backgroundAudio);
    if (backgroundAudio) {
      command
        .input(backgroundAudio)
        .inputOptions([`-t ${totalDuration}`, "-stream_loop -1"]);
      filterComplex.push(`[1:a]volume=0.1[audioBg];`);
    }

    // Add question images and overlay them on the background
    let inputIndex = backgroundAudio ? 2 : 1;
    let startTime = 0;
    questions.forEach((question, index) => {
      const duration = audioDurations[index] + soundEffect.duration;
      const endTime =
        startTime + duration + afterQuestionPause + afterAnswerPause;
      const percentageStartTime =
        startTime + duration + afterQuestionPause - soundEffect.duration + 0.6;

      const higherPercentageIndex =
        question[0].percentage > question[1].percentage ? 0 : 1;

      question.forEach((part, partIndex) => {
        const localImagePath = `./assets/Temp/question_${index}_part_${partIndex}.png`;
        const yPosImage = partIndex === 0 ? "H/8" : "H/1.45";
        let yPosText;
        if (part.questionText.length <= 30) {
          yPosText = partIndex === 0 ? "H/8 - 130" : "H/1.45 - 130";
        } else {
          yPosText = partIndex === 0 ? "H/8 - 180" : "H/1.45 - 180";
        }
        const yPosPercentage = partIndex === 0 ? "H/2.4" : "H/1.8";

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

        // Use the drawtext filter to add the question text
        filterComplex.push(
          `[fv]drawtext=text='${formattedText}':fontfile='./assets/Font/Roboto-Medium.ttf':fontsize=76:fontcolor=white:shadowcolor=black:shadowx=2:shadowy=2:x=(W-tw)/2:y=${yPosText}:enable='between(t,${startTime},${endTime})'[fv];`
        );

        const fontColorPercentage =
          partIndex === higherPercentageIndex ? "#00ff00" : "white";

        // Use the drawtext filter to add the question percentage
        filterComplex.push(
          `[fv]drawtext=text='${part.percentage}\\\\%':fontfile='./assets/Font/Roboto-Bold.ttf':fontsize=76:fontcolor=${fontColorPercentage}:shadowcolor=black:shadowx=2:shadowy=2:x=(W-tw)/2:y=${yPosPercentage}:enable='between(t,${percentageStartTime},${endTime})'[fv];`
        );

        inputIndex++;
      });

      // Add Narration Audio
      const narrationAudioPath = `./assets/Temp/narration_${index}.mp3`;
      command.input(narrationAudioPath);
      const delay = afterAnswerPause * 1000;
      if (index === 0) {
        filterComplex.push(`[${inputIndex}:a]adelay=0|0[aud${index}d];`);
      } else {
        filterComplex.push(
          `[${inputIndex}:a]adelay=${delay}|${delay}[aud${index}d];`
        );
      }
      inputIndex++;

      // Add sound effect audio after narration audio effect
      command.input(soundEffect.path);
      const delaySoundEffect = afterQuestionPause * 1000;
      filterComplex.push(
        `[${inputIndex}:a]adelay=${delaySoundEffect}|${delaySoundEffect}[aud${index}se];`
      );
      inputIndex++;

      startTime = endTime;
    });

    filterComplex.push(
      `${Array.from({ length: questions.length * 2 }, (_, i) => {
        const baseIndex = Math.floor(i / 2); // Calculate base question index
        const suffix = i % 2 === 0 ? "d" : "se"; // Determine the suffix based on whether it's a narration or sound effect
        return `[aud${baseIndex}${suffix}]`;
      }).join("")}concat=n=${questions.length * 2}:v=0:a=1[outa];`
    );

    const dynamicMapOptions = ["-map [fv]"];

    if (backgroundAudio) {
      filterComplex.push(
        `[outa][audioBg]amix=inputs=2:duration=first:dropout_transition=3[audioMix]`
      );
      dynamicMapOptions.push("-map [audioMix]");
    } else {
      dynamicMapOptions.push("-map [outa]");
    }

    // Concatenate all filter complex strings and add to command
    const complexFilterString = filterComplex.join("");
    command.complexFilter(complexFilterString);

    // Set output options
    command
      .output(outputPath)
      .outputOptions([
        ...dynamicMapOptions,
        "-profile:v baseline",
        "-level 3.0",
        "-pix_fmt yuv420p",
        // "-shortest",
        "-v verbose",
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

  await new Promise((resolve, reject) => {
    const writeStream = fs.createWriteStream(outputPath);
    response.data.pipe(writeStream);
    writeStream.on("finish", resolve);
    writeStream.on("error", reject);
  });
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

const generateSubtitlesFile = async (script, audioDuration, subtitlesPath) => {
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
  GetUserVideos,
  GetVideoByID,
  CreateVideos,
  UpdateVideo,
  DeleteVideo,
  GenerateGPTStoryVideo,
  GenerateWYRVideo,
};
