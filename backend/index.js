import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import User from './models/User.js';
import session from "express-session";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

dotenv.config();

const app = express();
const port = process.env.PORT || 3050;

// For __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());

// Session middleware (needed for passport)
app.use(session({ secret: "secretkey", resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

// ---------------- MONGODB CONNECTION ----------------
mongoose.connect(process.env.MONGO_URI);

// ---------------- STATIC FILES ----------------
app.use(express.static(path.join(__dirname, '../')));

// Serve index.html for root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

// Serve signup page
app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, '../signup.html'));
});

// Serve login page
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../login.html'));
});

// Passport serialize/deserialize
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});

// ---------------- AUTH ROUTES ----------------

// Signup
app.post('/api/signup', async (req, res) => {

    try {
         const { name, email, password, gender, dob,provider } = req.body;
        if (provider === "local") {
    if (!name || !password || !gender || !dob) {
        return res.status(400).json({ error: "All fields are required for local signup" });
    }
}

       

        if (!name || !email || !password || !gender || !dob) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            gender,
            dob
        });

        await newUser.save();

        res.status(201).json({ message: 'Signup successful', userId: newUser._id , redirect: '/index.html'});
    } catch (error) {
        console.error('Error during signup:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Google Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ email: profile.emails[0].value });
      if (!user) {
        user = new User({
          name: profile.displayName,
          email: profile.emails[0].value,
          password: null, // since Google handles it
          gender: "Not specified",
          dob: null
        });
        await user.save();
      }
      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }
));


// Google login route
app.get("/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Google callback route
app.get("/api/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login.html" }),
  (req, res) => {
    // Successful login
    res.redirect("/index.html"); // change to your home page
  }
);

// Login
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body; // Changed to email for consistency
        if (!email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        req.session.user = user; // store session
res.json({ message: 'Login successful', redirect: '/index.html' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ---------------- GEMINI API ----------------
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
    console.log(`🚀 Server running on port ${port}`);
});
