const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');
const { getChatResponse } = require('../services/aiService');
const { authenticateToken } = require('../middleware/auth');
const ALLOWED_LEVELS = new Set(['A1', 'A2', 'B1', 'B2']);

const normalizeLevel = (value) => {
    if (!value) return null;
    const level = String(value).trim().toUpperCase();
    return ALLOWED_LEVELS.has(level) ? level : null;
};

const canStudentAccessModule = async (db, studentId, moduleId) => {
    const student = await db.get('SELECT id, level, teacher_id FROM users WHERE id = ? AND role = ?', studentId, 'student');
    if (!student) return false;

    const assignment = await db.get(`
        SELECT a.id
        FROM assignments a
        WHERE a.module_id = ?
          AND (
                (a.teacher_id = ?)
                OR (a.teacher_id IS NULL AND ? IS NULL)
              )
          AND (a.student_id IS NULL OR a.student_id = ?)
          AND (a.target_level IS NULL OR UPPER(a.target_level) = UPPER(?))
        LIMIT 1
    `, moduleId, student.teacher_id, student.teacher_id, student.id, student.level || 'A1');

    return !!assignment;
};

// --- AI Chat ---
router.post('/chat', authenticateToken, async (req, res) => {
    const { messages, context } = req.body; // context can contain { moduleId, exerciseType }
    
    try {
        const db = await getDb();
        const user = await db.get('SELECT * FROM users WHERE id = ?', req.user.id);
        
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
// Updated to filter by assignment target rules if user is student
router.get('/modules', authenticateToken, async (req, res) => {
    try {
        const db = await getDb();

        if (req.user.role === 'student') {
            const student = await db.get('SELECT id, level, teacher_id FROM users WHERE id = ?', req.user.id);
            if (!student) return res.status(404).json({ error: 'Student not found' });

            const modules = await db.all(`
                SELECT DISTINCT m.*
                FROM modules m
                JOIN assignments a ON m.id = a.module_id
                WHERE (
                        (a.teacher_id = ?)
                        OR (a.teacher_id IS NULL AND ? IS NULL)
                      )
                  AND (a.student_id IS NULL OR a.student_id = ?)
                  AND (a.target_level IS NULL OR UPPER(a.target_level) = UPPER(?))
                ORDER BY m.id DESC
            `, student.teacher_id, student.teacher_id, student.id, student.level || 'A1');

            return res.json(modules);
        }

        if (req.user.role === 'teacher') {
            const modules = await db.all('SELECT * FROM modules ORDER BY id DESC');
            return res.json(modules);
        }

        return res.status(403).json({ error: 'Unsupported role' });
    } catch (err) {
        console.error("GET /modules error:", err);
        res.status(500).json({ error: "Failed to fetch modules", details: err.message });
    }
});

router.get('/modules/:id', authenticateToken, async (req, res) => {
    try {
        const db = await getDb();
        const module = await db.get('SELECT * FROM modules WHERE id = ?', req.params.id);
        if (!module) return res.status(404).json({ error: 'Module not found' });

        if (req.user.role === 'student') {
            const isAllowed = await canStudentAccessModule(db, req.user.id, req.params.id);
            if (!isAllowed) {
                return res.status(403).json({ error: 'Access denied to this module' });
            }
        }

        const exercises = await db.all('SELECT * FROM exercises WHERE module_id = ?', req.params.id);
        module.exercises = exercises.map(ex => ({
            ...ex,
            options: JSON.parse(ex.options)
        }));
        res.json(module);
    } catch (error) {
        console.error('GET /modules/:id error:', error);
        res.status(500).json({ error: 'Failed to fetch module' });
    }
});

// --- Placement Test (Simplified) ---
router.post('/placement-test', authenticateToken, async (req, res) => {
    const { score } = req.body;
    // Updated Logic for new 33-question test
    // 0-8: A1
    // 9-16: A2
    // 17-24: B1
    // 25+: B2
    let level = 'A1';
    if (score >= 25) level = 'B2';
    else if (score >= 17) level = 'B1';
    else if (score >= 9) level = 'A2';

    // Update user level
    try {
        const db = await getDb();
        await db.run("UPDATE users SET level = ? WHERE id = ?", level, req.user.id);
        res.json({ level });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to update level' });
    }
});

// --- User Progress ---
router.get('/user/progress', authenticateToken, async (req, res) => {
    try {
        const db = await getDb();
        const user = await db.get('SELECT * FROM users WHERE id = ?', req.user.id);
        const progress = await db.all(`
            SELECT m.title, p.score, p.completed_at, p.module_id 
            FROM progress p 
            JOIN modules m ON p.module_id = m.id 
            WHERE p.user_id = ?
        `, req.user.id);
        res.json({ user, progress });
    } catch (e) {
        res.status(500).json({ error: 'Server error' });
    }
});

// --- Save Module Progress ---
router.post('/progress', authenticateToken, async (req, res) => {
    const { moduleId, score, reflection, details, ai_history } = req.body;
    const userId = req.user.id;
    
    try {
        const db = await getDb();
        // Check if already completed
        const existing = await db.get('SELECT * FROM progress WHERE user_id = ? AND module_id = ?', userId, moduleId);
        
        const reflectionStr = reflection ? JSON.stringify(reflection) : null;
        const detailsStr = details ? JSON.stringify(details) : null;
        const aiHistoryStr = ai_history ? JSON.stringify(ai_history) : null;

        if (existing) {
            // Update score, reflection, details, ai_history
            await db.run('UPDATE progress SET score = ?, reflection = ?, details = ?, ai_history = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?', 
                Math.max(existing.score, score), reflectionStr, detailsStr, aiHistoryStr, existing.id);
        } else {
            await db.run('INSERT INTO progress (user_id, module_id, score, reflection, details, ai_history) VALUES (?, ?, ?, ?, ?, ?)', 
                userId, moduleId, score, reflectionStr, detailsStr, aiHistoryStr);
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error("Progress Save Error Details:", error);
        console.error("Body:", req.body);
        res.status(500).json({ error: error.message, stack: error.stack });
    }
});

// --- Teacher Dashboard ---
router.get('/profile/teacher/dashboard', authenticateToken, async (req, res) => {
    // Check role, for now assume simple auth is enough or check req.user.role if needed, 
    // but the token payload might not have it unless we put it there. 
    // Let's assume the UI handles the redirection for now, but good to add check.
    
    try {
        const db = await getDb();
        
        // 1. Get My Students
        // (Assuming students are linked by teacher_id, or we find all students if we are the only teacher for demo)
        // For this demo: Let's show ALL students if I am a teacher, or filter by teacher_id if we had that logic.
        // Let's rely on users.teacher_id = req.user.id
        
        const students = await db.all(`
            SELECT id, username, full_name, level, role 
            FROM users 
            WHERE teacher_id = ? OR role = 'student' -- FALLBACK for demo: show all students
        `, req.user.id); // In real app, remove OR role='student' if strict

        // 2. Get Statistics for these students
        const studentStats = [];
        let totalScoreSum = 0;
        let totalModulesCount = 0;

        for (const student of students) {
             const progress = await db.all('SELECT * FROM progress WHERE user_id = ?', student.id);
             const completedCount = progress.length;
             const avg = completedCount > 0 ? progress.reduce((a, b) => a + b.score, 0) / completedCount : 0;
             
             // Get latest reflection
             const lastProgress = await db.get('SELECT * FROM progress WHERE user_id = ? ORDER BY completed_at DESC LIMIT 1', student.id);
             let lastReflection = null;
             let lastModuleTitle = null;
             if (lastProgress) {
                 if (lastProgress.reflection) lastReflection = JSON.parse(lastProgress.reflection);
                 const m = await db.get('SELECT title FROM modules WHERE id = ?', lastProgress.module_id);
                 lastModuleTitle = m ? m.title : 'Unknown Module';
             }

             studentStats.push({
                 ...student,
                 progress: Math.round(avg), // using avg score as "progress" visual for now
                 completedModules: completedCount,
                 lastReflection,
                 lastModuleTitle
             });

             totalScoreSum += avg;
             if(avg > 0) totalModulesCount++;
        }

        const classAvg = students.length > 0 ? Math.round(totalScoreSum / students.length) : 0;

        res.json({
            students: studentStats,
            stats: {
                totalStudents: students.length,
                avgScore: classAvg
            }
        });

    } catch (error) {
        console.error("Dashboard Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// --- Assignments (Open/Close Modules) ---

// Assign (Open) a module
router.post('/assignments', authenticateToken, async (req, res) => {
    const { moduleId, studentId, targetLevel } = req.body;
    const teacherId = req.user.id;

    try {
        const db = await getDb();

        if (req.user.role !== 'teacher') {
            return res.status(403).json({ error: 'Teachers only' });
        }
        if (!moduleId) {
            return res.status(400).json({ error: 'moduleId is required' });
        }

        const normalizedTargetLevel = normalizeLevel(targetLevel);
        if (targetLevel && !normalizedTargetLevel) {
            return res.status(400).json({ error: 'Invalid target level' });
        }

        let normalizedStudentId = studentId ? Number(studentId) : null;
        if (normalizedStudentId) {
            const student = await db.get('SELECT id, role, teacher_id FROM users WHERE id = ?', normalizedStudentId);
            if (!student || student.role !== 'student') {
                return res.status(404).json({ error: 'Student not found' });
            }
            if (student.teacher_id && student.teacher_id !== teacherId) {
                return res.status(403).json({ error: 'This student is not linked to your account' });
            }
        } else {
            normalizedStudentId = null;
        }

        const existing = await db.get(`
            SELECT id FROM assignments
            WHERE teacher_id = ?
              AND module_id = ?
              AND ((student_id IS NULL AND ? IS NULL) OR student_id = ?)
              AND ((target_level IS NULL AND ? IS NULL) OR UPPER(target_level) = UPPER(?))
            LIMIT 1
        `, teacherId, moduleId, normalizedStudentId, normalizedStudentId, normalizedTargetLevel, normalizedTargetLevel);

        if (!existing) {
            await db.run(
                'INSERT INTO assignments (teacher_id, module_id, student_id, target_level) VALUES (?, ?, ?, ?)',
                teacherId,
                moduleId,
                normalizedStudentId,
                normalizedTargetLevel
            );
        }

        res.json({
            success: true,
            message: existing ? 'Assignment already exists' : 'Module opened successfully'
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Unassign (Close) a module
router.delete('/assignments', authenticateToken, async (req, res) => {
    const { assignmentId, moduleId } = req.body;
    const teacherId = req.user.id;

    try {
        const db = await getDb();
        if (req.user.role !== 'teacher') {
            return res.status(403).json({ error: 'Teachers only' });
        }

        if (assignmentId) {
            await db.run('DELETE FROM assignments WHERE id = ? AND teacher_id = ?', assignmentId, teacherId);
        } else if (moduleId) {
            await db.run('DELETE FROM assignments WHERE teacher_id = ? AND module_id = ?', teacherId, moduleId);
        } else {
            return res.status(400).json({ error: 'assignmentId or moduleId is required' });
        }

        res.json({ success: true, message: 'Module closed successfully' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.get('/assignments', authenticateToken, async (req, res) => {
    try {
        const db = await getDb();

        if (req.user.role === 'teacher') {
            const assignments = await db.all(`
                SELECT a.*, m.title, m.type, m.level, u.full_name as target_student_name, u.username as target_student_username
                FROM assignments a
                JOIN modules m ON a.module_id = m.id
                LEFT JOIN users u ON u.id = a.student_id
                WHERE a.teacher_id = ?
                ORDER BY a.assigned_at DESC
            `, req.user.id);
            return res.json(assignments);
        }

        if (req.user.role === 'student') {
            const user = await db.get('SELECT id, teacher_id, level FROM users WHERE id = ?', req.user.id);
            if (!user) return res.status(404).json({ error: 'Student not found' });

            const assignments = await db.all(`
                SELECT a.*, m.title, m.type, m.level
                FROM assignments a
                JOIN modules m ON a.module_id = m.id
                WHERE (
                        (a.teacher_id = ?)
                        OR (a.teacher_id IS NULL AND ? IS NULL)
                      )
                  AND (a.student_id IS NULL OR a.student_id = ?)
                  AND (a.target_level IS NULL OR UPPER(a.target_level) = UPPER(?))
                ORDER BY a.assigned_at DESC
            `, user.teacher_id, user.teacher_id, user.id, user.level || 'A1');

            return res.json(assignments);
        }

        res.status(403).json({ error: 'Unsupported role' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Get Student History (Teacher View)
router.get('/teacher/student/:id/history', authenticateToken, async (req, res) => {
    try {
        const db = await getDb();
        const history = await db.all(`
            SELECT p.*, m.title as module_title, m.type as module_type
            FROM progress p
            JOIN modules m ON p.module_id = m.id
            WHERE p.user_id = ?
            ORDER BY p.completed_at DESC
        `, req.params.id);
        
        res.json(history);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Get Specific Progress Details (Teacher View)
router.get('/teacher/progress/:id', authenticateToken, async (req, res) => {
    try {
        const db = await getDb();
        const progress = await db.get(`
            SELECT p.*, m.title as module_title, m.content as module_content
            FROM progress p
            JOIN modules m ON p.module_id = m.id
            WHERE p.id = ?
        `, req.params.id);
        
        if (!progress) return res.status(404).json({ error: 'Progress not found' });

        // Retrieve exercises to show correct answers
        const exercises = await db.all('SELECT * FROM exercises WHERE module_id = ?', progress.module_id);
        
        // Parse options if needed, though mostly we need correct_answer or id
        const parsedExercises = exercises.map(ex => ({
            ...ex,
            options: ex.options ? JSON.parse(ex.options) : []
        }));

        res.json({ ...progress, exerciseData: parsedExercises });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Update Progress Score (Teacher Action)
router.put('/teacher/progress/:id', authenticateToken, async (req, res) => {
    const { score } = req.body;
    try {
        const db = await getDb();
        // Check if user is teacher (optional, strictly speaking we rely on authenticateToken and context, 
        // but for a thesis demo checking if they are 'teacher' or linked is good. Skipping for brevity/demo flexibility)
        
        await db.run('UPDATE progress SET score = ? WHERE id = ?', score, req.params.id);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
