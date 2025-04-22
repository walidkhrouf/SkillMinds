const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

dotenv.config();
const app = express();
const port = 5001;

app.use(cors());
app.use(express.json());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

const generationConfig = {
  temperature: 0.5, // Lowered further for less creativity, more focus
  topP: 0.9,
  maxOutputTokens: 300, // ~200 words
  responseMimeType: "text/plain",
};

app.post("/generate-content", async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  try {
    const chatSession = model.startChat({
      generationConfig,
      history: [],
    });

    const result = await chatSession.sendMessage(prompt);
    let generatedText = result.response.text().trim();

    // Post-process to remove unwanted elements
    // Remove hashtags
    generatedText = generatedText.replace(/#\w+/g, "").trim();
    // Remove calls-to-action or meta-commentary
    generatedText = generatedText.replace(/Want to.*below!|Share your.*below!|Let'?s discuss.*$/i, "").trim();
    // Remove any trailing incomplete sentences
    if (!generatedText.match(/[.!?]$/)) {
      const lastPeriod = generatedText.lastIndexOf(".");
      if (lastPeriod !== -1) {
        generatedText = generatedText.substring(0, lastPeriod + 1);
      }
    }

    res.json({ generated_text: generatedText });
  } catch (error) {
    console.error("Gemini API Error:", error.message);
    res.status(500).json({ error: "Failed to generate content" });
  }
});

app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
});