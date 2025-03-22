// index.js (Backend Node.js with Express)
import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv'; // For environment variables
import cors from 'cors';

dotenv.config(); // Load environment variables from .env file

const app = express();

const port = 3050;
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hello World!');
});


async function listGeminiModels(apiKey) {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data.models; // Return the models array
    } catch (error) {
        console.error('Error listing models:', error);
        return null;
    }
}

app.post('/api/gemini', async (req, res) => {
    console.log("someone here");
    const { message } = req.body;
    console.log("message", message);

    // Validate incoming data
    if (!message || typeof message !== 'string') {
        return res.status(400).json({ reply: 'Invalid message format' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    console.log(apiKey);

    if (!apiKey) {
        return res.status(500).json({ reply: 'API key not configured' });
    }

    try {
        const availableModels = await listGeminiModels(apiKey);

        if (availableModels) {
            console.log("Available Models:", availableModels);

            if (availableModels.length === 0) {
                res.status(500).json({ reply: "No models are available to your API key." });
                return;
            }

            const selectedModel = "models/gemini-1.5-flash"; // Use Gemini 1.5 Flash

            console.log("Selected Model:", selectedModel);

            // Refined prompt
            const prompt = "Just give me the text response to the following input: " + message;

            const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/${selectedModel}:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }],
                    }],
                    generationConfig: {
                        temperature: 0.9,
                        topK: 1,
                        topP: 1,
                        maxOutputTokens: 2048,
                    },
                }),
            });

            if (!geminiResponse.ok) {
                console.error(`Gemini API Error: ${geminiResponse.status} ${geminiResponse.statusText}`);
                const errorData = await geminiResponse.json();
                console.error("Gemini API Error details:", errorData);
                return res.status(geminiResponse.status).json({ reply: 'Gemini API Error', error: errorData });
            }

            const geminiData = await geminiResponse.json();

            if (geminiData.candidates && geminiData.candidates.length > 0 && geminiData.candidates[0].content && geminiData.candidates[0].content.parts && geminiData.candidates[0].content.parts.length > 0) {
                const responseText = geminiData.candidates[0].content.parts[0].text.trim();
                res.json({ reply: responseText });
            } else if (geminiData.error) {
                console.error("Gemini API returned an error within the data:", geminiData.error);
                res.status(500).json({ reply: "Gemini API returned an error.", error: geminiData.error });
            } else {
                res.status(500).json({ reply: 'Unexpected Gemini API response structure' });
            }

        } else {
            res.status(500).json({ reply: "Could not retrieve available models." });
        }

    } catch (error) {
        console.error('Gemini API Request Failed:', error);
        res.status(500).json({ reply: 'Internal Server Error' });
    }
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});