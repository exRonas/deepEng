const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

let dbInstance = null;

async function getDb() {
    if (dbInstance) return dbInstance;

    const dbPath = path.resolve(__dirname, 'deepeng.sqlite');
    
    dbInstance = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    return dbInstance;
}

async function initDb() {
    const db = await getDb();

    // Reset for Thesis Demo (Optional: remove this in production)
    await db.exec(`DROP TABLE IF EXISTS exercises`);
    await db.exec(`DROP TABLE IF EXISTS modules`);
    await db.exec(`DROP TABLE IF EXISTS progress`);
    await db.exec(`DROP TABLE IF EXISTS users`);

    // Users Table
    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            level TEXT DEFAULT 'A1',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // Modules Table
    await db.exec(`
        CREATE TABLE IF NOT EXISTS modules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            level TEXT,
            type TEXT, -- 'grammar', 'vocabulary', 'reading', 'test'
            title TEXT,
            description TEXT,
            content TEXT -- JSON string for theory/reading text
        );
    `);

    // Exercises Table
    await db.exec(`
        CREATE TABLE IF NOT EXISTS exercises (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            module_id INTEGER,
            type TEXT, -- 'multiple-choice', 'fill-gap', 'true-false', 'matching'
            question TEXT,
            options TEXT, -- JSON string of options
            correct_answer TEXT,
            explanation TEXT,
            FOREIGN KEY(module_id) REFERENCES modules(id)
        );
    `);

    // Progress Table
    await db.exec(`
        CREATE TABLE IF NOT EXISTS progress (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            module_id INTEGER,
            score INTEGER,
            completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id),
            FOREIGN KEY(module_id) REFERENCES modules(id)
        );
    `);

    // Check if we need to seed (checking if modules exist instead of users to be safe)
    const moduleCount = await db.get('SELECT count(*) as count FROM modules');
    if (moduleCount.count === 0) {
        console.log('Seeding database with A1 Kids Module...');
        
        // Ensure user exists
        await db.run(`INSERT OR IGNORE INTO users (username, level) VALUES ('student1', 'A1')`);
        
        // --- 1. GRAMMAR MODULE: Verb "to be" ---
        let res = await db.run(`INSERT INTO modules (level, type, title, description, content) VALUES (?, ?, ?, ?, ?)`,
            'A1', 
            'grammar', 
            'Superheroes: The Verb "to be"', 
            'Learn how to say who you are!',
            JSON.stringify({
                theory: [
                    "We use **am**, **is**, and **are** to say who or what something is.",
                    "👉 **I am** (I'm) -> I am a student.",
                    "👉 **He / She / It is** (He's) -> He is my friend.",
                    "👉 **You / We / They are** (They're) -> We are happy."
                ]
            })
        );
        let modId = res.lastID;

        // Exercises for Grammar
        await db.run(`INSERT INTO exercises (module_id, type, question, options, correct_answer, explanation) VALUES (?, ?, ?, ?, ?, ?)`,
            modId, 'multiple-choice', 'I ___ a superhero!', JSON.stringify(['is', 'am', 'are']), 'am', 'With "I", we always use "am".'
        );
        await db.run(`INSERT INTO exercises (module_id, type, question, options, correct_answer, explanation) VALUES (?, ?, ?, ?, ?, ?)`,
            modId, 'multiple-choice', 'She ___ my sister.', JSON.stringify(['am', 'is', 'are']), 'is', 'With "She", we use "is".'
        );
        await db.run(`INSERT INTO exercises (module_id, type, question, options, correct_answer, explanation) VALUES (?, ?, ?, ?, ?, ?)`,
            modId, 'fill-gap', 'They ___ playing football.', JSON.stringify([]), 'are', 'With "They", we use "are".'
        );

        // --- 2. VOCABULARY MODULE: Family & Colors ---
        res = await db.run(`INSERT INTO modules (level, type, title, description, content) VALUES (?, ?, ?, ?, ?)`,
            'A1', 
            'vocabulary', 
            'My Colorful Family', 
            'Learn words about family and colors.',
            JSON.stringify({
                theory: [
                    "👨‍👩‍👧‍👦 **Family Words**:",
                    "Mother (Mom), Father (Dad), Sister, Brother, Grandmother (Grandma).",
                    "🎨 **Colors**:",
                    "Red 🔴, Blue 🔵, Green 🟢, Yellow 🟡."
                ]
            })
        );
        modId = res.lastID;

        // Exercises for Vocabulary
        await db.run(`INSERT INTO exercises (module_id, type, question, options, correct_answer, explanation) VALUES (?, ?, ?, ?, ?, ?)`,
            modId, 'multiple-choice', 'What color is the sun? ☀️', JSON.stringify(['Blue', 'Yellow', 'Red']), 'Yellow', 'The sun is usually yellow.'
        );
        await db.run(`INSERT INTO exercises (module_id, type, question, options, correct_answer, explanation) VALUES (?, ?, ?, ?, ?, ?)`,
            modId, 'matching', 'Father', JSON.stringify(['Dad', 'Mom', 'Sister']), 'Dad', 'Father is also called Dad.'
        );

        // --- 3. READING MODULE: My Dog Max ---
        res = await db.run(`INSERT INTO modules (level, type, title, description, content) VALUES (?, ?, ?, ?, ?)`,
            'A1', 
            'reading', 
            'My Dog Max', 
            'Read a short story about a funny dog.',
            JSON.stringify({
                text: "This is Max. Max is my dog. He is big and brown. Max likes to play ball. He is a good boy.",
                translation: "Это Макс. Макс — моя собака. Он большой и коричневый. Макс любит играть в мяч. Он хороший мальчик."
            })
        );
        modId = res.lastID;

        // Exercises for Reading
        await db.run(`INSERT INTO exercises (module_id, type, question, options, correct_answer, explanation) VALUES (?, ?, ?, ?, ?, ?)`,
            modId, 'true-false', 'Max is a cat.', JSON.stringify(['True', 'False']), 'False', 'The text says "Max is my dog".'
        );
        await db.run(`INSERT INTO exercises (module_id, type, question, options, correct_answer, explanation) VALUES (?, ?, ?, ?, ?, ?)`,
            modId, 'multiple-choice', 'What color is Max?', JSON.stringify(['Black', 'Brown', 'White']), 'Brown', 'The text says "He is big and brown".'
        );

        // --- 4. MINI TEST ---
        res = await db.run(`INSERT INTO modules (level, type, title, description, content) VALUES (?, ?, ?, ?, ?)`,
            'A1', 
            'test', 
            'Level A1 Final Test', 
            'Check what you learned!',
            JSON.stringify({ intro: "Good luck! Try to get 100%." })
        );
        modId = res.lastID;

        // Test Questions
        await db.run(`INSERT INTO exercises (module_id, type, question, options, correct_answer, explanation) VALUES (?, ?, ?, ?, ?, ?)`,
            modId, 'multiple-choice', 'We ___ friends.', JSON.stringify(['am', 'is', 'are']), 'are', 'We + are.'
        );
        await db.run(`INSERT INTO exercises (module_id, type, question, options, correct_answer, explanation) VALUES (?, ?, ?, ?, ?, ?)`,
            modId, 'fill-gap', 'My mom is happy. ___ is smiling.', JSON.stringify(['He', 'She', 'It']), 'She', 'Mom is a woman, so we use "She".'
        );
        await db.run(`INSERT INTO exercises (module_id, type, question, options, correct_answer, explanation) VALUES (?, ?, ?, ?, ?, ?)`,
            modId, 'multiple-choice', 'Is it a cat? No, it ___.', JSON.stringify(['is', 'isn\'t', 'aren\'t']), 'isn\'t', 'Negative short answer: No, it isn\'t.'
        );
    }

    console.log('Database initialized.');
}

module.exports = { getDb, initDb };
