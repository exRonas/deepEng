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
    // await db.exec(`DROP TABLE IF EXISTS exercises`);
    // await db.exec(`DROP TABLE IF EXISTS modules`);
    // await db.exec(`DROP TABLE IF EXISTS progress`);
    // await db.exec(`DROP TABLE IF EXISTS users`);

    // Users Table
    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE, -- used for teacher login or student display name
            phone TEXT UNIQUE,    -- used for student login
            full_name TEXT,
            password TEXT,
            role TEXT DEFAULT 'student', -- 'student' or 'teacher'
            level TEXT DEFAULT 'A1',
            teacher_id INTEGER, -- For students to link to a teacher
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // Modules Table
    await db.exec(`
        CREATE TABLE IF NOT EXISTS modules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            level TEXT,
            type TEXT, -- 'grammar', 'vocabulary', 'reading', 'writing'
            title TEXT,
            description TEXT,
            content TEXT -- JSON string for theory, ai_task, reflection
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
            reflection TEXT, -- JSON string for reflection answers
            details TEXT,    -- JSON string for detailed answers (e.g. which questions were wrong)
            ai_history TEXT, -- JSON string for AI chat history
            completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id),
            FOREIGN KEY(module_id) REFERENCES modules(id)
        );
    `);

    // Assignments Table
    await db.exec(`
        CREATE TABLE IF NOT EXISTS assignments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            teacher_id INTEGER,
            module_id INTEGER,
            assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(teacher_id) REFERENCES users(id),
            FOREIGN KEY(module_id) REFERENCES modules(id)
        );
    `);

    // Dictionary Table
    await db.exec(`
        CREATE TABLE IF NOT EXISTS dictionary (
            word TEXT PRIMARY KEY,
            translation TEXT
        );
    `);

    // Check if we need to seed
    const moduleCount = await db.get('SELECT count(*) as count FROM modules');
    if (moduleCount.count === 0) { // Only seed if empty
        console.log('Seeding database with Zakaz Content (Russian Updated)...');
        // Clear existing for clean seed (Optional, but good for dev)
        // await db.run('DELETE FROM modules'); 
        // await db.run('DELETE FROM exercises');
        // await db.run('DELETE FROM dictionary');
        
        // 1. Create Teacher and Student
        // Teacher: teacher123 / teacher123
        await db.run(`INSERT OR IGNORE INTO users (username, role, level, full_name, password) VALUES (?, ?, ?, ?, ?)`, 
            'teacher123', 'teacher', null, 'Main Teacher', 'teacher123'
        );
        
        // Student: student example
        await db.run(`INSERT OR IGNORE INTO users (username, phone, role, level, full_name, password, teacher_id) VALUES (?, ?, ?, ?, ?, ?, ?)`, 
            'student1', '87001234567', 'student', 'A1', 'Student Example', 'password', 1
        );
        
        // --- DICTIONARY SEEDING ---
        const dictWords = [
            // Pronouns
            ['i', 'я'], ['you', 'ты / вы'], ['he', 'он'], ['she', 'она'], ['it', 'оно'], ['we', 'мы'], ['they', 'они'],
            // To Be
            ['am', 'есть (для я)'], ['is', 'есть (для он/она/оно)'], ['are', 'есть (для мы/вы/они)'],
            // Nouns
            ['student', 'студент / ученик'], ['brother', 'брат'], ['friends', 'друзья'], 
            ['mother', 'мама'], ['father', 'папа'], ['sister', 'сестра'], ['grandmother', 'бабушка'], ['grandfather', 'дедушка'],
            ['family', 'семья'], ['members', 'члены'], ['parents', 'родители'],
            // Common
            ['what', 'что'], ['where', 'где'], ['who', 'кто'], ['hello', 'привет'], ['goodbye', 'пока'],
            ['cat', 'кошка'], ['dog', 'собака'], ['house', 'дом'], ['car', 'машина'], ['book', 'книга']
        ];

        for (const [w, t] of dictWords) {
            await db.run('INSERT OR REPLACE INTO dictionary (word, translation) VALUES (?, ?)', w, t);
        }

        // --- 1. GRAMMAR A1: Verb "to be" ---
        let grammarRes = await db.run(`INSERT INTO modules (level, type, title, description, content) VALUES (?, ?, ?, ?, ?)`,
            'A1', 
            'grammar', 
            'Grammar A1: Глагол "to be"', 
            'Выучи самый главный глагол английского языка!',
            JSON.stringify({
                theory: [
                    "**Что такое глагол TO BE?** Он означает 'быть', 'находиться', 'являться'. В русском языке мы его часто опускаем (например, 'Я студент'), но в английском он обязателен ('I am a student').",
                    "Три формы в настоящем времени:",
                    "1. **am** – используется только с 'I' (Я). \nПример: I am a student (Я студент).",
                    "2. **is** – используется с 'He' (Он), 'She' (Она), 'It' (Оно). \nПример: He is my brother (Он мой брат).",
                    "3. **are** – используется с 'We' (Мы), 'You' (Ты/Вы), 'They' (Они). \nПример: We are friends (Мы друзья)."
                ],
                ai_task: {
                    prompt: "Нажми 'Talk to AI'. Скажи 3 предложения о себе, используя 'am'. Пример: 'I am a student. I am 12 years old. I am from Kazakhstan.'",
                    system_message: "You are an English teacher for kids. The student is practicing the verb 'to be'. Check if they use 'am', 'is', 'are' correctly. Speak simply."
                },
                reflection: [
                    "Что было легко?",
                    "Что показалось сложным?",
                    "Как ты себя чувствуешь, используя 'to be'?"
                ]
            })
        );
        const grammarId = grammarRes.lastID;

        // Exercises for Grammar
        const grammarExercises = [
            { q: "I ___ from Kazakhstan.", options: ["am", "is", "are", "be"], correct: "am", explanation: "С местоимением 'I' мы всегда используем 'am'." },
            { q: "My sister ___ 10 years old.", options: ["am", "is", "are", "be"], correct: "is", explanation: "Sister = She (Она). С She мы используем 'is'." },
            { q: "We ___ students.", options: ["am", "is", "are", "be"], correct: "are", explanation: "С местоимением 'We' (Мы) мы используем 'are'." },
        ];

        for (let ex of grammarExercises) {
            await db.run(`INSERT INTO exercises (module_id, type, question, options, correct_answer, explanation) VALUES (?, ?, ?, ?, ?, ?)`,
                grammarId, 'multiple-choice', ex.q, JSON.stringify(ex.options), ex.correct, ex.explanation
            );
        }

        // --- 2. VOCABULARY A1: My Family ---
        let vocabRes = await db.run(`INSERT INTO modules (level, type, title, description, content) VALUES (?, ?, ?, ?, ?)`,
            'A1', 
            'vocabulary', 
            'Vocabulary A1: Моя Семья', 
            'Выучи слова о членах семьи.',
            JSON.stringify({
                theory: [
                    "**Mother** – мама",
                    "**Father** – папа",
                    "**Sister** / **Brother** – сестра / брат",
                    "**Grandmother** / **Grandfather** – бабушка / дедушка",
                    "Попробуй назвать своих родных на английском!"
                ],
                ai_task: {
                   prompt: "Расскажи ИИ про свою семью. Скажи: 'This is my mother. Her name is...'",
                   system_message: "You are a kind teacher. Ask the student about their family names. 'What is your mother's name?'"
                },
                reflection: [
                    "Какие слова ты запомнил?",
                    "Кого из семьи тебе легче всего назвать?"
                ]
            })
        );
        const vocabId = vocabRes.lastID;

        // Exercises for Vocabulary
        const vocabExercises = [
            { q: "My father's father is my ___.", options: ["uncle", "grandfather", "cousin", "brother"], correct: "grandfather", explanation: "Father's father = Grandfather." },
            { q: "My mother's daughter is my ___.", options: ["aunt", "grandmother", "sister", "mother"], correct: "sister", explanation: "Mother's daughter is your sister (or you!)." }
        ];

        for (let ex of vocabExercises) {
            await db.run(`INSERT INTO exercises (module_id, type, question, options, correct_answer, explanation) VALUES (?, ?, ?, ?, ?, ?)`,
                vocabId, 'multiple-choice', ex.q, JSON.stringify(ex.options), ex.correct, ex.explanation
            );
        }

        // --- 3. READING A1: My Family ---
        let readingRes = await db.run(`INSERT INTO modules (level, type, title, description, content) VALUES (?, ?, ?, ?, ?)`,
            'A1', 
            'reading', 
            'Reading A1: Текст "Моя Семья"', 
            'Прочитай текст про Айсулу и её семью.',
            JSON.stringify({
                theory: [
                    "**Стратегии чтения**: Посмотри на картинки, найди знакомые слова, не пытайся перевести каждое слово.",
                    "**Новые слова**: live (жить), with (с), pet (домашнее животное)."
                ],
                text: "Hello! My name is Aisulu. I am 11 years old. I live in Almaty with my family. We are a big family. I have a mother, a father, one brother and one sister. We have a cat named Tom.",
                translation: "Привет! Меня зовут Айсулу. Мне 11 лет. Я живу в Алматы с семьей...",
                ai_task: {
                    prompt: "Нажми 'Talk to AI'. ИИ задаст тебе вопросы по тексту.",
                    system_message: "You are a tutor. The student has ALREADY answered 'Where does she live?' and 'What is the cat's name?' in the exercises. DO NOT ASK THESE AGAIN. Instead, ask questions about relationships (e.g. 'Is her family big or small?'), logical deduction (e.g. 'How many children are in the family?'), or personal connection (e.g. 'Do you have a cat?'). Start with: 'Is Aisulu's family big?'"
                },
                reflection: [
                    "Сколько ты понял?",
                    "Что было легко читать?"
                ]
            })
        );
        const readingId = readingRes.lastID;

        const readingExercises = [
             { q: "Where does Aisulu live?", options: ["Astana", "Almaty", "Shymkent", "Aktobe"], correct: "Almaty", explanation: "Text says: 'I live in Almaty'" },
             { q: "What is her pet's name?", options: ["Max", "Tom", "Kitty"], correct: "Tom", explanation: "Text says: 'Its name is Tom'" }
        ];

        for (let ex of readingExercises) {
            await db.run(`INSERT INTO exercises (module_id, type, question, options, correct_answer, explanation) VALUES (?, ?, ?, ?, ?, ?)`,
                readingId, 'multiple-choice', ex.q, JSON.stringify(ex.options), ex.correct, ex.explanation
            );
        }

        // --- 4. WRITING A1: About Me ---
        let writingRes = await db.run(`INSERT INTO modules (level, type, title, description, content) VALUES (?, ?, ?, ?, ?)`,
            'A1', 
            'writing', 
            'Writing A1: About Me', 
            'Learn to write simple sentences about yourself.',
            JSON.stringify({
                theory: [
                    "**Writing Rules**: Start with capital letter. End with a dot (.).",
                    "**Templates**:",
                    "My name is ______.",
                    "I am ______ years old.",
                    "I am from ______.",
                    "I have a ______."
                ],
                ai_task: {
                    prompt: "Write 5 sentences about yourself. Click 'Talk to AI' and paste them. AI will check your grammar.",
                    system_message: "You are a writing tutor. Correct the student's text. If they write 'i from almaty', correct to 'I am from Almaty'. Explain the mistake."
                },
                reflection: [
                    "What was easy?",
                    "How do you feel about your writing?"
                ]
            })
        );
        const writingId = writingRes.lastID;

        const writingExercises = [
            { q: "My ______ is Asel.", options: ["name", "years", "from"], correct: "name", explanation: "My name is..." },
            { q: "I ______ 12 years old.", options: ["name", "am", "from"], correct: "am", explanation: "I am..." }
        ];

        for (let ex of writingExercises) {
            await db.run(`INSERT INTO exercises (module_id, type, question, options, correct_answer, explanation) VALUES (?, ?, ?, ?, ?, ?)`,
                writingId, 'multiple-choice', ex.q, JSON.stringify(ex.options), ex.correct, ex.explanation
            );
        }

        console.log('Database seeded successfully with Zakaz Content.');
    }


    console.log('Database initialized.');
}

module.exports = { getDb, initDb };
