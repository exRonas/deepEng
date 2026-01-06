const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'db/deepeng.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    console.log("Applying migrations...");
    
    // 1. Add reflection column to progress
    db.run("ALTER TABLE progress ADD COLUMN reflection TEXT", (err) => {
        if (err) {
            if (err.message.includes('duplicate column name')) {
                console.log("Column 'reflection' already exists in 'progress'.");
            } else {
                console.error("Error adding column 'reflection':", err.message);
            }
        } else {
            console.log("Successfully added 'reflection' column to 'progress'.");
        }
    });

    // 2. Ensure assignments table exists
    db.run(`
        CREATE TABLE IF NOT EXISTS assignments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            teacher_id INTEGER,
            module_id INTEGER,
            assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(teacher_id) REFERENCES users(id),
            FOREIGN KEY(module_id) REFERENCES modules(id)
        );
    `, (err) => {
        if (err) console.error("Error creating assignments table:", err.message);
        else console.log("Assignments table checked/created.");
    });
});

db.close();
