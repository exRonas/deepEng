const axios = require('axios');
require('dotenv').config();

// const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';
const API_URL = 'https://api.openai.com/v1/chat/completions'; // Switched to OpenAI
const API_KEY = process.env.DEEPSEEK_API_KEY; // Using the key from env (even if named DEEPSEEK)

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
    2. Respond primarily in Russian to explain concepts, but use English for examples and exercises.
    3. If the user makes a mistake, gently correct them and explain why in Russian.
    4. Keep responses concise and encouraging.
    5. CRITICAL: NEVER provide the direct answer to a question or exercise immediately. Instead, use hints, leading questions, or explain the grammar rule to help the student find the answer themselves (Socratic method).
    6. If the student asks for the answer, refuse gently and offer a hint instead.
    `;

    let contextPrompt = "";

    if (context.customSystemMessage) {
        // Specific AI Task override
        
        // HACK: Force fix for Reading A1 repetition issue
        let finalSystemMessage = context.customSystemMessage;
        if (context.moduleTitle && context.moduleTitle.includes('Reading A1') || finalSystemMessage.includes('My Family')) {
             finalSystemMessage += " IMPORTANT: The student has already answered basic questions like 'Where does she live?' and 'What is the cat's name?'. DO NOT ask these. DO NOT ask about relationships or feelings not in the text. Ask only about family size or deductions based on FACTS (e.g. 'Is the family big?'). If no factual questions remain, say 'Тест завершен. Отличная работа!' and stop.";
        }

        contextPrompt = `
        Current Context: SPECIFIC AI TASK.
        Instruction for AI: ${finalSystemMessage}
        The user's task is: "${context.userTaskPrompt}"
        
        CRITICAL INSTRUCTION FOR CONTEXT AWARENESS:
        You are currently in a continuous dialogue with the student.
        1. ANALYZE the 'messages' history provided below.
        2. Identify which questions or topics you have ALREADY asked or discussed.
        3. Do NOT repeat the same questions.
        4. If you asked a question and the user answered, acknowledge it and move to the NEXT logical step or question.
        5. If the user's answer was correct, praise them and ask a *different* follow-up question.
        6. If the task is to "ask questions about the text", ask them ONE BY ONE. Do not dump all questions at once.
        7. STRICT FACTUALITY: Only ask questions about information present in the text. Do not invent details.
        8. STOP CONDITION: If you cannot ask a new question based on the text, say "Тест завершен." and refuse to continue.
        9. SCORING CS: When the conversation ends (or you say "Тест завершен"), you MUST evaluate the student's performance from 0 to 100. Append the score in this EXACT format at the very end of your message: [[SCORE: 85]].
        `;
    } else if (context.moduleTitle) {
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

        // Prepare the payload for OpenAI API
        const payload = {
            model: "gpt-4o", // Changed from deepseek-chat to gpt-4o
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

        const response = await axios.post(API_URL, payload, {
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
