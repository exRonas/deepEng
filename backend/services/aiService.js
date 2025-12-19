const axios = require('axios');
require('dotenv').config();

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';
const API_KEY = process.env.DEEPSEEK_API_KEY;

/**
 * Generates a dynamic system prompt based on user context.
 * This is the core of the "Adaptive Learning" feature for the thesis.
 */
function generateSystemPrompt(userLevel, context = {}) {
    const basePrompt = `
    You are "DeepEng Tutor", an expert AI English teacher.
    Your goal is to help a student with English level: ${userLevel}.
    
    Pedagogical Rules:
    1. Adapt your vocabulary to the ${userLevel} level (CEFR standards).
    2. If the user makes a mistake, gently correct them and explain why.
    3. Keep responses concise and encouraging.
    4. Never give the direct answer to a test question immediately; guide them to it.
    `;

    let contextPrompt = "";

    if (context.moduleTitle) {
        contextPrompt = `
        Current Context: The student is studying the module "${context.moduleTitle}" (${context.moduleType}).
        Focus your explanations on this topic.
        `;
    } else if (context.isPlacementTest) {
        contextPrompt = `
        Current Context: The student is taking a Placement Test. 
        Do NOT give answers. Only explain the grammatical concepts if asked.
        `;
    } else {
        contextPrompt = `
        Current Context: General conversation practice. 
        Proactively ask simple questions to keep the dialogue going.
        `;
    }

    return `${basePrompt}\n${contextPrompt}`;
}

async function getChatResponse(messages, userLevel, context = {}) {
    try {
        const systemMessage = {
            role: 'system',
            content: generateSystemPrompt(userLevel, context)
        };

        // Prepare the payload for DeepSeek API
        // Using 'deepseek-chat' model (compatible with OpenAI format)
        const payload = {
            model: "deepseek-chat",
            messages: [systemMessage, ...messages],
            temperature: 0.7,
            max_tokens: 500, // Limit response length for concise teaching
            stream: false
        };

        // Mock response for development/demo if no key provided
        if (!API_KEY || API_KEY === 'your_deepseek_api_key_here') {
            console.warn('⚠️ No valid DEEPSEEK_API_KEY. Using Mock Mode.');
            return {
                role: 'assistant',
                content: `[DEMO MODE - DeepSeek Simulator]\n\n(Level: ${userLevel})\nThat's a great question! Since I'm in demo mode, I'll pretend to explain "${messages[messages.length - 1].content}" simply. In a real deployment, I would use the DeepSeek API to generate a context-aware answer.`
            };
        }

        const response = await axios.post(DEEPSEEK_API_URL, payload, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            }
        });

        return response.data.choices[0].message;

    } catch (error) {
        console.error('AI Service Error:', error.response ? error.response.data : error.message);
        // Fallback for UI stability
        return {
            role: 'assistant',
            content: "I'm having trouble connecting to my brain (DeepSeek API). Please try again in a moment."
        };
    }
}

module.exports = { getChatResponse };
