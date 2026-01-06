const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../db/database');
const { JWT_SECRET } = require('../middleware/auth');

// Register (Student)
router.post('/register', async (req, res) => {
    const { phone, fullName, password, teacherId } = req.body;
    
    if (!phone || !fullName || !password) {
        return res.status(400).json({ error: 'Please provide phone, full name, and password' });
    }

    try {
        const db = await getDb();
        const existing = await db.get('SELECT * FROM users WHERE phone = ?', phone);
        if (existing) {
            return res.status(400).json({ error: 'User with this phone already exists' });
        }

        // Use plain text for now if bcrypt fails, but trying bcrypt
        let hashedPassword = password;
        try {
           hashedPassword = await bcrypt.hash(password, 10);
        } catch (e) {
            console.error("Hashing failed, using plain text (dev mode)", e);
        }

        // Generate a username from full name
        const username = fullName.split(' ')[0].toLowerCase() + Math.floor(Math.random() * 1000);

        const result = await db.run(
            `INSERT INTO users (phone, full_name, password, role, level, teacher_id, username) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            phone, fullName, hashedPassword, 'student', 'A1', teacherId || 1, username
        );

        const token = jwt.sign({ id: result.lastID, role: 'student', name: fullName }, JWT_SECRET);
        
        res.json({ token, user: { id: result.lastID, username, role: 'student', full_name: fullName } });

    } catch (error) {
        console.error("REGISTRATION ERROR:", error);
        res.status(500).json({ error: 'Server error during registration: ' + error.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    const { identifier, password } = req.body; // identifier can be phone or username

    try {
        const db = await getDb();
        const user = await db.get('SELECT * FROM users WHERE phone = ? OR username = ?', identifier, identifier);

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        let isValid = false;
        // Check if password matches (support both hashed and plain text for legacy/dev)
        if (user.password === password) {
            isValid = true;
        } else {
            isValid = await bcrypt.compare(password, user.password);
        }

        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id, role: user.role, name: user.full_name || user.username }, JWT_SECRET);
        
        res.json({ token, user: { id: user.id, username: user.username, role: user.role, full_name: user.full_name } });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error during login' });
    }
});

// Get Current User (Me)
router.get('/me', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token' });

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const db = await getDb();
        const user = await db.get('SELECT id, username, full_name, role, level FROM users WHERE id = ?', decoded.id);
        res.json(user);
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
});

module.exports = router;
