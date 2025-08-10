import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const port = process.env.PORT || 3050; // Use Render/Railway's port

// For __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());

// Serve static files from project root (frontend HTML/CSS/JS)
app.use(express.static(path.join(__dirname, '../')));

// Serve index.html for root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

// Function to list Gemini models
async function listGeminiModels(apiKey) {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        return data.models;
    } catch (error) {
        console.error('Error listing models:', error);
        return null;
    }
}

// Gemini API endpoint
app.post('/api/gemini', async (req, res) => {
    const { message } = req.body;
    if (!message || typeof message !== 'string') {
        return res.status(400).json({ reply: 'Invalid message format' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ reply: 'API key not configured' });
    }

    try {
        const availableModels = await listGeminiModels(apiKey);
        if (!availableModels || availableModels.length === 0) {
            return res.status(500).json({ reply: "No models available for your API key." });
        }

        const selectedModel = "models/gemini-1.5-flash";
        const prompt = "Just give me the text response to the following input: " + message;

        const geminiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/${selectedModel}:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.9,
                        topK: 1,
                        topP: 1,
                        maxOutputTokens: 2048,
                    },
                }),
            }
        );

        if (!geminiResponse.ok) {
            const errorData = await geminiResponse.json();
            return res.status(geminiResponse.status).json({ reply: 'Gemini API Error', error: errorData });
        }

        const geminiData = await geminiResponse.json();
        if (geminiData.candidates?.[0]?.content?.parts?.[0]?.text) {
            res.json({ reply: geminiData.candidates[0].content.parts[0].text.trim() });
        } else {
            res.status(500).json({ reply: 'Unexpected Gemini API response structure' });
        }
    } catch (error) {
        console.error('Gemini API Request Failed:', error);
        res.status(500).json({ reply: 'Internal Server Error' });
    }
});

app.listen(port, () => {
    console.log(` Server running on port ${port}`);
});
