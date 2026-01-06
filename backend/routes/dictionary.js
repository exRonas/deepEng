const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');

// Get translation for a word
router.get('/:word', async (req, res) => {
    try {
        const db = await getDb();
        const word = req.params.word.toLowerCase();
        
        const result = await db.get('SELECT translation FROM dictionary WHERE word = ?', word);
        
        if (result) {
            res.json({ translation: result.translation });
        } else {
            res.status(404).json({ error: 'Not found' });
        }
    } catch (error) {
        console.error('Dictionary Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
