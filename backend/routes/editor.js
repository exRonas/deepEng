const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');
const fs = require('fs-extra');
const path = require('path');
const slugify = require('slugify');

// Middleware to check if user is teacher
const isTeacher = (req, res, next) => {
    if (req.user && req.user.role === 'teacher') {
        next();
    } else {
        res.status(403).json({ error: 'Access denied: Teachers only' });
    }
};

// Create a new module
router.post('/modules', authenticateToken, isTeacher, async (req, res) => {
    try {
        const { title, description, level, type, content } = req.body;
        const db = await getDb();
        
        const result = await db.run(
            `INSERT INTO modules (title, description, level, type, content) VALUES (?, ?, ?, ?, ?)`,
            title, description, level, type, JSON.stringify(content || {})
        );
        
        res.status(201).json({ id: result.lastID, message: 'Module created successfully' });
    } catch (error) {
        console.error('Create Module Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update a full module (metadata + exercises)
router.put('/modules/:id', authenticateToken, isTeacher, async (req, res) => {
    const { id } = req.params;
    const { title, description, level, type, content, exercises } = req.body;
    
    try {
        const db = await getDb();
        
        // 1. Update Module Metadata
        await db.run(
            `UPDATE modules SET title = ?, description = ?, level = ?, type = ?, content = ? WHERE id = ?`,
            title, description, level, type, JSON.stringify(content || {}), id
        );
        
        // 2. Update Exercises (Delete all and recreate - simplest strategy for full save)
        // Note: This changes IDs of exercises, which might affect progress tracking if progress tracks exercise_id specifically.
        // Let's check: progress table tracks 'module_id' and 'details' (JSON). If details references exercise IDs, we might break history.
        // However, for a simple editor V1, this is acceptable. Ideally, we should diff/upsert.
        
        await db.run(`DELETE FROM exercises WHERE module_id = ?`, id);
        
        if (exercises && Array.isArray(exercises)) {
            const stmt = await db.prepare(
                `INSERT INTO exercises (module_id, type, question, options, correct_answer, explanation) VALUES (?, ?, ?, ?, ?, ?)`
            );
            
            for (const ex of exercises) {
                await stmt.run(
                    id,
                    ex.type,
                    ex.question,
                    JSON.stringify(ex.options),
                    ex.correct_answer,
                    ex.explanation
                );
            }
            await stmt.finalize();
        }
        
        res.json({ message: 'Module updated successfully' });
    } catch (error) {
        console.error('Update Module Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete a module
router.delete('/modules/:id', authenticateToken, isTeacher, async (req, res) => {
    const { id } = req.params;
    try {
        const db = await getDb();
        
        // 1. Get module title to find the audio folder
        const module = await db.get(`SELECT title FROM modules WHERE id = ?`, id);
        
        if (module && module.title) {
             const slug = slugify(module.title, { lower: true, strict: true, locale: 'en' });
             const folderPath = path.join(__dirname, '../../pronounce', slug);
             
             // Check if exists and delete
             if (await fs.pathExists(folderPath)) {
                 await fs.remove(folderPath);
                 console.log(`Deleted audio folder: ${folderPath}`);
             }
        }

        // Delete related data first
        await db.run(`DELETE FROM exercises WHERE module_id = ?`, id);
        await db.run(`DELETE FROM assignments WHERE module_id = ?`, id);
        // Note: Progress might need to be kept or deleted depending on policy.
        
        await db.run(`DELETE FROM modules WHERE id = ?`, id);
        res.json({ message: 'Module deleted successfully' });
    } catch (error) {
        console.error("Delete Error", error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
