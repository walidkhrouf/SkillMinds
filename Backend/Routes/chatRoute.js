const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs").promises;
const router = express.Router();


const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Load SkillMind context with error handling
async function loadContext() {
    try {
        const context = await fs.readFile("skillmind_context.json", "utf-8");
        return JSON.parse(context);
    } catch (error) {
        console.error("Error loading context file:", error.message);
        return {
            platform: "SkillMind",
            description: "A platform for learning and skill exchange.",
            features: {},
            common_queries: {}
        };
    }
}

router.post("/chat", async (req, res) => {
    try {
        console.log("Received request:", req.body);
        const { message } = req.body;
        if (!message) {
            console.log("Missing message in request body");
            return res.status(400).json({ error: "Message is required" });
        }

        const context = await loadContext();
        const prompt = `You are a helpful assistant for SkillMind, a platform for learning, community interaction, and career growth. Use the following context: ${JSON.stringify(context)}. User query: ${message}`;
        console.log("Generating content with prompt:", prompt);

        const result = await model.generateContent(prompt);
        const reply = result.response?.text() || "Sorry, I couldn't generate a response.";
        console.log("Generated reply:", reply);
        res.json({ reply });
    } catch (error) {
        console.error("Error in chat:", error.message);
        if (error.message.includes("API key")) {
            return res.status(401).json({ error: "Invalid API key" });
        } else if (error.message.includes("network")) {
            return res.status(503).json({ error: "Service unavailable" });
        } else {
            return res.status(500).json({ error: "Internal server error" });
        }
    }
});

module.exports = router;