import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Initialize Gemini SDK with named parameters as specified in skills
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

app.use(express.json({ limit: "50mb" }));

// API Endpoint 1: Assess Pronunciation using Gemini (Web Speech API Transcript Alignment)
app.post("/api/assess-pronunciation", async (req, res) => {
  try {
    const { referenceText, transcribedText, accent } = req.body;

    if (!referenceText) {
      return res.status(400).json({ error: "referenceText is required" });
    }

    const systemInstruction = `You are an expert English pronunciation assessor and AI speech coach. 
Your task is to compare the user's spoken transcription with the original reference text.
Evaluate their performance and output a highly detailed JSON assessment report.

The accent specified by the user is: ${accent || "General American"}.

Guidelines for evaluation:
1. "wordAssessments": For EVERY single word in the original reference text (preserving exact sequence, punctuation, and casing), assess if the user said it correctly ("good"), struggled with it ("struggled"), or missed it entirely ("omitted").
   - If the word exists in the transcription and is pronounced well: "good".
   - If the word exists but is slightly slurred, mispronounced, or has typos/hesitations: "struggled".
   - If the word was skipped or not spoken in the transcription: "omitted".
2. Scores (integer from 0 to 100):
   - "overallScore": Comprehensive weighted average of accuracy, fluency, and completeness.
   - "accuracy": How correctly the words were pronounced.
   - "fluency": Rate and flow. If there are many hesitations, repetitions, or filler words, fluency should be lower.
   - "completeness": Percentage of words in the reference text that were actually spoken.
3. "problemWords": Identify up to 5 words in the reference text where the user struggled ("struggled" or "omitted"), or words that are generally challenging for English learners in this accent.
   - For each problem word, provide its IPA (International Phonetic Alphabet) and a short, encouraging, actionable tip on how to pronounce it correctly (e.g., mouth shape, tongue placement, syllable emphasis).
4. "coachFeedback": A friendly, encouraging, and detailed summary of the performance (2-3 sentences), with tips for improvement.

CRITICAL: Return EXACTLY the JSON schema specified, with no extra formatting, markdown wraps, or HTML. Ensure every single word from the reference text is included in 'wordAssessments' in order.`;

    const userPrompt = `
Reference text: "${referenceText}"
User's spoken transcription: "${transcribedText || "[No speech detected]"}"
`;

    // Call Gemini with strict response schema to guarantee type-safe JSON
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallScore: { type: Type.INTEGER, description: "Overall pronunciation score (0-100)" },
            accuracy: { type: Type.INTEGER, description: "Accuracy score (0-100)" },
            fluency: { type: Type.INTEGER, description: "Fluency score (0-100)" },
            completeness: { type: Type.INTEGER, description: "Completeness score (0-100)" },
            wordAssessments: {
              type: Type.ARRAY,
              description: "Assessments for each word in the reference text, in order",
              items: {
                type: Type.OBJECT,
                properties: {
                  word: { type: Type.STRING, description: "The original word from referenceText" },
                  status: { type: Type.STRING, description: "Must be 'good', 'struggled', or 'omitted'" },
                },
                required: ["word", "status"],
              },
            },
            problemWords: {
              type: Type.ARRAY,
              description: "Tricky words that need practice",
              items: {
                type: Type.OBJECT,
                properties: {
                  word: { type: Type.STRING },
                  ipa: { type: Type.STRING, description: "IPA representation of the word" },
                  explanation: { type: Type.STRING, description: "Cute, short tip on how to pronounce it" },
                },
                required: ["word", "ipa", "explanation"],
              },
            },
            coachFeedback: {
              type: Type.STRING,
              description: "A friendly paragraph of advice from the AI tutor",
            },
          },
          required: ["overallScore", "accuracy", "fluency", "completeness", "wordAssessments", "problemWords", "coachFeedback"],
        },
      },
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Empty response from Gemini API");
    }

    const data = JSON.parse(resultText.trim());
    res.json(data);
  } catch (error: any) {
    console.error("Error in /api/assess-pronunciation:", error);
    res.status(500).json({ error: error.message || "Internal server error during assessment" });
  }
});

// API Endpoint 2: Generate custom English practice texts based on user selection or custom topic
app.post("/api/generate-text", async (req, res) => {
  try {
    const { topic, difficulty } = req.body; // e.g. "Restaurant", "Job Interview", "Easy"
    
    const prompt = `Generate a short English practice paragraph (between 30 to 50 words) suitable for reading aloud and practicing pronunciation.
Topic: ${topic || "Daily Conversation"}
Difficulty: ${difficulty || "Intermediate"}

Make it sound natural, interesting, and include a few words that are great for pronunciation practice (e.g. words with 'th', 'r', 'l', or silent letters).
Return a JSON object with:
- "title": A short catchy title
- "text": The practice paragraph text
- "trickyWords": An array of 3-4 interesting or challenging words in the paragraph with their simple meanings or why they are there.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            text: { type: Type.STRING },
            trickyWords: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  word: { type: Type.STRING },
                  reason: { type: Type.STRING },
                },
                required: ["word", "reason"],
              },
            },
          },
          required: ["title", "text", "trickyWords"],
        },
      },
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Empty response from Gemini API");
    }

    const data = JSON.parse(resultText.trim());
    res.json(data);
  } catch (error: any) {
    console.error("Error in /api/generate-text:", error);
    res.status(500).json({ error: error.message || "Failed to generate text" });
  }
});

// API Endpoint 3: Azure Pronunciation Assessment Proxy (for users with custom key & region)
app.post("/api/assess-azure", async (req, res) => {
  try {
    const { referenceText, audioBase64, region, key, accent } = req.body;

    if (!referenceText || !audioBase64 || !region || !key) {
      return res.status(400).json({ error: "Missing required fields for Azure Speech assessment" });
    }

    // Convert base64 audio back to buffer
    const audioBuffer = Buffer.from(audioBase64, "base64");

    // Prepare Azure Pronunciation Assessment parameters
    const pronAssessmentParams = {
      ReferenceText: referenceText,
      GradingSystem: "HundredMark",
      Granularity: "Word",
      Dimension: "Comprehensive",
      ScenarioId: "",
    };

    const base64Params = Buffer.from(JSON.stringify(pronAssessmentParams)).toString("base64");

    // Call Azure Cognitive Services REST API for speech recognition with pronunciation assessment
    const language = accent || "en-US";
    const url = `https://${region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=${language}&format=detailed`;

    const azureResponse = await fetch(url, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": key,
        "Content-Type": "audio/wav; codecs=audio/pcm; samplerate=16000",
        "Pronunciation-Assessment": base64Params,
        "Accept": "application/json",
      },
      body: audioBuffer,
    });

    if (!azureResponse.ok) {
      const errorText = await azureResponse.text();
      return res.status(azureResponse.status).json({
        error: `Azure Speech API error: ${azureResponse.status} ${azureResponse.statusText}. Details: ${errorText}`,
      });
    }

    const azureData = await azureResponse.json();
    res.json(azureData);
  } catch (error: any) {
    console.error("Error in /api/assess-azure:", error);
    res.status(500).json({ error: error.message || "Azure Speech assessment failed" });
  }
});

// Vite middleware for development or static serving for production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
