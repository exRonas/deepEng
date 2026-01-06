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

    // 1. Clean up: Delete modules from DB that are NOT in the JSON file
    // This ensures the DB strictly mirrors the JSON content.
    const moduleIds = modules.map(m => m.id);
    if (moduleIds.length > 0) {
        const placeholders = moduleIds.map(() => '?').join(',');
        
        // Delete related data first (since no ON DELETE CASCADE)
        db.run(`DELETE FROM exercises WHERE module_id NOT IN (${placeholders})`, moduleIds);
        db.run(`DELETE FROM progress WHERE module_id NOT IN (${placeholders})`, moduleIds);
        db.run(`DELETE FROM modules WHERE id NOT IN (${placeholders})`, moduleIds, (err) => {
            if (!err) console.log('Cleaned up old/deleted modules from database.');
        });
    }

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
