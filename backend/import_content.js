const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, 'db/deepeng.sqlite');
const contentPath = path.resolve(__dirname, 'content/modules.json');

if (!fs.existsSync(contentPath)) {
    console.error('Modules file not found at:', contentPath);
    process.exit(1);
}

const modules = JSON.parse(fs.readFileSync(contentPath, 'utf-8'));
const db = new sqlite3.Database(dbPath);

console.log(`Found ${modules.length} modules to import.`);

db.serialize(() => {
    // We use INSERT OR REPLACE to update existing modules or add new ones without breaking IDs
    const stmt = db.prepare(`
        INSERT OR REPLACE INTO modules (id, level, type, title, description, content)
        VALUES (?, ?, ?, ?, ?, ?)
    `);

    db.run("BEGIN TRANSACTION");

    modules.forEach(m => {
        // Stringify content back for DB storage
        const contentStr = JSON.stringify(m.content);
        
        stmt.run(m.id, m.level, m.type, m.title, m.description, contentStr, (err) => {
            if (err) console.error(`Error importing module ${m.title}:`, err.message);
            else console.log(`Imported: ${m.title}`);
        });
    });

    db.run("COMMIT", () => {
        console.log('Import complete.');
        stmt.finalize(() => {
            db.close();
        });
    });
});
