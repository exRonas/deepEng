const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');
const { getChatResponse } = require('../services/aiService');

// --- AI Chat ---
router.post('/chat', async (req, res) => {
    const { messages, context } = req.body; // context can contain { moduleId, exerciseType }
    
    try {
        const db = await getDb();
        // In a real app, we get userId from session/token. For MVP, we use ID 1.
        const user = await db.get('SELECT * FROM users WHERE id = 1');
        
        // Enrich context if moduleId is provided
        let enrichedContext = { ...context };
        if (context && context.moduleId) {
            const module = await db.get('SELECT title, type FROM modules WHERE id = ?', context.moduleId);
            if (module) {
                enrichedContext.moduleTitle = module.title;
                enrichedContext.moduleType = module.type;
            }
        }

        const response = await getChatResponse(messages, user.level || 'A1', enrichedContext);
        res.json(response);
    } catch (error) {
        console.error("Chat Route Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// --- Modules ---
router.get('/modules', async (req, res) => {
    const db = await getDb();
    const modules = await db.all('SELECT * FROM modules');
    res.json(modules);
});

router.get('/modules/:id', async (req, res) => {
    const db = await getDb();
    const module = await db.get('SELECT * FROM modules WHERE id = ?', req.params.id);
    if (module) {
        const exercises = await db.all('SELECT * FROM exercises WHERE module_id = ?', req.params.id);
        module.exercises = exercises.map(ex => ({
            ...ex,
            options: JSON.parse(ex.options)
        }));
        res.json(module);
    } else {
        res.status(404).json({ error: 'Module not found' });
    }
});

// --- Placement Test (Simplified) ---
router.post('/placement-test', async (req, res) => {
    const { score } = req.body;
    let level = 'A1';
    if (score > 8) level = 'B2';
    else if (score > 5) level = 'B1';
    else if (score > 2) level = 'A2';

    // Update user level (assuming single user 'student1' for MVP)
    const db = await getDb();
    await db.run("UPDATE users SET level = ? WHERE username = 'student1'", level);

    res.json({ level });
});

// --- User Progress ---
router.get('/user/progress', async (req, res) => {
    const db = await getDb();
    // Assuming user ID 1 for MVP
    const user = await db.get('SELECT * FROM users WHERE id = 1');
    const progress = await db.all(`
        SELECT m.title, p.score, p.completed_at 
        FROM progress p 
        JOIN modules m ON p.module_id = m.id 
        WHERE p.user_id = 1
    `);
    res.json({ user, progress });
});

module.exports = router;
