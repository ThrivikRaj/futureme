const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

// Initialize Gemini API
const apiKey = process.env.GEMINI_API_KEY;
let genAI;

if (apiKey && apiKey !== 'replace_with_your_gemini_api_key') {
  genAI = new GoogleGenerativeAI(apiKey);
} else {
  console.warn('WARNING: GEMINI_API_KEY is not configured or contains placeholder value. Please check your .env file.');
}

// Helper to strip markdown formatting from JSON responses
function parseCleanJSON(text) {
  let cleaned = text.trim();
  // Strip codeblock indicators if present
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.substring(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.substring(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.substring(0, cleaned.length - 3);
  }
  cleaned = cleaned.trim();
  return JSON.parse(cleaned);
}

// Tone directives mapping to inject specific behavioral guardrails
const toneDirectives = {
  'Motivational': 'Your tone must be warm, highly inspiring, supportive, and emotionally resonant. Help the user see their strength.',
  'Brutally Honest': 'Your tone must be extremely direct, sharp, uncompromising, and allow zero excuses. Call out self-sabotaging behavior clearly.',
  'Calm Mentor': 'Your tone must be peaceful, wise, grounded, patient, and deeply perspective-oriented. Provide quiet structural clarity.',
  'CEO Mode': 'Your tone must be strategic, focused, execution-heavy, systems-oriented, and objective. Treat capacity and life metrics like enterprise resources.'
};

// Route: Generate FutureMe Profile
app.post('/api/generate-futureme', async (req, res) => {
  try {
    if (!genAI) {
      return res.status(500).json({
        success: false,
        message: 'FutureMe could not respond right now. Try again.'
      });
    }

    const { name, age, goal, struggle, oneYearVision, tone } = req.body;

    // Server-side validation
    if (!name || !age || !goal || !struggle || !oneYearVision || !tone) {
      return res.status(400).json({
        success: false,
        message: 'All parameters must be provided to calibrate identity.'
      });
    }

    const toneDirective = toneDirectives[tone] || toneDirectives['Brutally Honest'];

    const prompt = `You are FutureMe, the future successful version of the user who has fully realized their goal and vision. You are not a generic motivational coach. You speak with emotional intelligence, clarity, and deep personal understanding. Your job is to help the user see who they are becoming, what they must change, and what they should do next.

Write as if you are the user's future self speaking directly to their current self.

Tone selected by user: ${tone}
Tone Directive: ${toneDirective}

User details:
Name: ${name}
Age: ${age}
Goal: ${goal}
Current struggle: ${struggle}
One-year vision: ${oneYearVision}

Return only valid JSON in this exact format:
{
  "message": "A powerful 120-180 word message from the future self.",
  "futureIdentity": "A concise description of who the user is becoming.",
  "nextMoves": ["Action 1", "Action 2", "Action 3"],
  "habit": "One small daily habit they should start today.",
  "warning": "One mistake their future self warns them about.",
  "mantra": "A short memorable line they can repeat daily."
}

Make it specific to their struggle ("${struggle}") and their goal ("${goal}"). Avoid generic motivation. Avoid clichés. Make it emotional but practical.`;

    const model = genAI.getGenerativeModel({
      model: 'gemini-3.5-flash',
      generationConfig: { responseMimeType: 'application/json' }
    });

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    const parsedData = parseCleanJSON(responseText);

    res.json({
      success: true,
      data: parsedData
    });

  } catch (error) {
    console.error('Error generating FutureMe:', error);
    res.status(500).json({
      success: false,
      message: 'FutureMe could not respond right now. Try again.'
    });
  }
});

// Route: Chat with FutureMe
app.post('/api/chat-futureme', async (req, res) => {
  try {
    if (!genAI) {
      return res.status(500).json({
        success: false,
        message: 'FutureMe could not respond right now. Try again.'
      });
    }

    const { userProfile, chatHistory, question } = req.body;

    if (!userProfile || !question) {
      return res.status(400).json({
        success: false,
        message: 'User profile and current question are required.'
      });
    }

    const { name, age, goal, struggle, oneYearVision, tone } = userProfile;
    const toneDirective = toneDirectives[tone] || toneDirectives['Brutally Honest'];

    // Format chat history
    let formattedHistory = '';
    if (chatHistory && Array.isArray(chatHistory)) {
      formattedHistory = chatHistory.map(chat => {
        const roleName = chat.role === 'user' ? 'User' : 'FutureMe';
        return `${roleName}: ${chat.message}`;
      }).join('\n');
    }

    const prompt = `You are FutureMe, the future version of the user who already achieved their one-year vision of "${oneYearVision}". Reply directly to the user's question. Be personal, sharp, honest, and useful. Do not sound like a normal AI assistant. Do not mention that you are Gemini or an AI model. Speak like the future self.

User profile:
Name: ${name}
Age: ${age}
Goal: ${goal}
Struggle: ${struggle}
One-year vision: ${oneYearVision}
Tone: ${tone}
Tone Directive: ${toneDirective}

Recent chat history:
${formattedHistory}

Current question:
${question}

Reply in 2-5 short paragraphs. Give at least one clear action. Ensure your reply matches the tone constraint: "${toneDirective}".`;

    const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });
    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();

    res.json({
      success: true,
      reply: responseText
    });

  } catch (error) {
    console.error('Error chatting with FutureMe:', error);
    res.status(500).json({
      success: false,
      message: 'FutureMe could not respond right now. Try again.'
    });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`FutureMe server successfully launched and running at http://localhost:${PORT}`);
});
