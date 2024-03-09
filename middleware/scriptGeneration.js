const OpenAI = require("openai");

const openai = new OpenAI();

const generateVideoScript = async (req, res, next) => {
  const topic = req.body.prompt;
  const scriptDurationInMinutes = req.body.duration || 1;
  const averageWordsPerMinute = 160;

  // Adjust maxTokens based on the duration of the video
  const maxTokens = scriptDurationInMinutes * averageWordsPerMinute * 5;

  // Update the system message to reflect dynamic duration
  const messages = [
    {
      role: "system",
      content: `You are a helpful assistant tasked with generating a concise, exciting, and engaging script suitable for narration in a reel video of approximately ${scriptDurationInMinutes} minute(s), focusing only on factual content without any dialogue tags or speaker names. The script should be optimized for viewer engagement, making it ideal for platforms like YouTube and Instagram Reels.`,
    },
    {
      role: "user",
      content: "hidden facts about the acient civilization of machu pichu.",
    },
    {
      role: "assistant",
      content: `Did you know there's a hidden gem nestled high in the Peruvian Andes, a city built by the Incas that remained veiled from the world until its discovery in 1911? Welcome to Machu Picchu, an architectural marvel where stones are so precisely cut, not even a blade fits between them. This city aligns perfectly with the stars and the sun, boasting an ancient sundial that baffles scientists even today. But what secrets does Machu Picchu hold? Was it a royal sanctuary, a sacred site, or an agricultural masterpiece? The mystery deepens with every terrace and path, whispering tales of a civilization both advanced and enigmatic. Join us on a journey to the heart of this ancient wonder, where history and legend intertwine, inviting the brave to explore. Machu Picchu isn't just a relic; it's a testament to the ingenuity of the Incas, a place where every stone tells a story, and the past reaches out to the present.
`,
    },
    { role: "user", content: `${topic}.` },
  ];

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: messages,
      max_tokens: maxTokens, // Control the length of the generated content
      temperature: 0.5, // Adjust for creativity; lower values produce more deterministic output
      top_p: 1.0, // Controls diversity via nucleus sampling: 0.5 means half of all likelihood-weighted options are considered
      frequency_penalty: 0.0, // Decreases the model's likelihood to repeat the same line verbatim
      presence_penalty: 0.0, // Adjusts for new and engaging content
    });

    // Extracting the assistant's reply as the script
    const script = completion.choices[0].message.content;

    res.status(200).json({ script });
  } catch (error) {
    console.error("Error generating video script:", error);
    res
      .status(500)
      .json({ error: "Failed to generate script", message: error.message });
  }
};

const generateWYRQuestions = async (req, res, next) => {
  // Number of questions you want to generate
  const numberOfQuestions = 10;

  // Constructing messages for the conversation
  const messages = [
    {
      role: "system",
      content:
        "You are a creative assistant tasked with generating engaging 'Would You Rather' questions. Each question should have two parts, including a compelling scenario and an approximate percentage indicating the preference, and a simple image prompt description representing that question part. Format each question so that each question is separated by '-', and within each question, each part is separated by '_', and within each part, the scenario, its percentage, and the image prompt description are separated by ':'. Ensure the questions are concise, unique, thought-provoking, and suitable for a general audience.",
    },
    {
      role: "user",
      content: `Can you generate two 'Would You Rather' questions for me? They should be formatted with each question separated by '-', question parts separated by '_', and within each part, the scenario, its percentage, and the image prompt description separated by ':'.`,
    },
    {
      role: "assistant",
      content: `Sure, here's an example of two would you rather questions in the specified format:
      fly like a bird:80:A bird soaring high above mountains_swim like a fish:20:A fish swimming in a coral reef - be invisible:51:A person fading into thin air_have super strength:49:A superhero lifting a car`,
    },
    {
      role: "user",
      content: `Great, please generate ${numberOfQuestions} 'Would You Rather' questions in the same format.`,
    },
  ];

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: messages,
      max_tokens: 1800,
      temperature: 0.7,
      top_p: 1.0,
      frequency_penalty: 0.0,
      presence_penalty: 0.0,
    });
    // Extract the completion from the last message from the assistant
    const lastMessage = completion.choices[0].message.content;
    const questionsRaw = lastMessage.trim();

    const questionsSplit = questionsRaw.trim().split("\n");

    // Parsing each question to extract parts and percentage
    const questions = questionsSplit.map((question) => {
      question = question.replace(/^\- /, "").trim();
      const parts = question.split("_");
      const questionParts = parts.map((part) => {
        const [text, percentage, imagePrompt] = part.split(":");
        return {
          questionText: text.trim(),
          percentage: parseInt(percentage.trim(), 10),
          imagePrompt: imagePrompt.trim(),
        };
      });
      return questionParts;
    });

    res.status(200).json({ questions });
  } catch (error) {
    console.error("Error generating 'Would You Rather' questions:", error);
    res
      .status(500)
      .json({ error: "Failed to generate questions", message: error.message });
  }
};

module.exports = { generateVideoScript, generateWYRQuestions };
