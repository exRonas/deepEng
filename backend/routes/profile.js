const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

// Get User Profile & Progress
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const db = await getDb();
        
        // User Details
        const user = await db.get('SELECT id, full_name, username, role, level, created_at FROM users WHERE id = ?', req.user.id);
        
        // Progress Stats
        const progress = await db.all(`
            SELECT p.score, p.completed_at, m.title, m.type 
            FROM progress p 
            JOIN modules m ON p.module_id = m.id 
            WHERE p.user_id = ? 
            ORDER BY p.completed_at DESC
        `, req.user.id);

        res.json({ user, progress });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Teacher Dashboard Data
router.get('/teacher/dashboard', authenticateToken, async (req, res) => {
    if (req.user.role !== 'teacher') return res.status(403).json({ error: 'Teachers only' });

    try {
        const db = await getDb();
        
        // Get all students linked to this teacher (or all students for MVP)
        // Assuming teacher has ID 1 and we linked student to it earlier
        // const students = await db.all('SELECT id, full_name, level FROM users WHERE role = "student" AND teacher_id = ?', req.user.id);
        
        // MVP: Just get all students
        const students = await db.all('SELECT id, full_name, level, username FROM users WHERE role = "student"');

        const studentsWithProgress = await Promise.all(students.map(async (s) => {
            const completed = await db.all('SELECT * FROM progress WHERE user_id = ?', s.id);
            const avgScore = completed.length > 0 
                ? Math.round(completed.reduce((acc, curr) => acc + curr.score, 0) / completed.length) 
                : 0;
            return {
                ...s,
                progress: avgScore,
                completedModules: completed.length
            };
        }));

        const totalStudents = students.length;
        const classAverage = totalStudents > 0 
            ? Math.round(studentsWithProgress.reduce((acc, s) => acc + s.progress, 0) / totalStudents)
            : 0;

        res.json({
            stats: { totalStudents, avgScore: classAverage },
            students: studentsWithProgress
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
