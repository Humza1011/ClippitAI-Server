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
    console.log(completion.usage);

    res.status(200).json({ script });
  } catch (error) {
    console.error("Error generating video script:", error);
    res
      .status(500)
      .json({ error: "Failed to generate script", message: error.message });
  }
};

module.exports = { generateVideoScript };
