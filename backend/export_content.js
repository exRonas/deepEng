const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, 'db/deepeng.sqlite');
const outputPath = path.resolve(__dirname, 'content/modules.json');

const db = new sqlite3.Database(dbPath);

async function exportData() {
    try {
        const modules = await new Promise((resolve, reject) => {
            db.all("SELECT * FROM modules", (err, rows) => {
                if (err) reject(err); else resolve(rows);
            });
        });

        const exercises = await new Promise((resolve, reject) => {
            db.all("SELECT * FROM exercises", (err, rows) => {
                if (err) reject(err); else resolve(rows);
            });
        });

        // Merge exercises into modules
        const fullModules = modules.map(m => {
            const moduleExercises = exercises.filter(e => e.module_id === m.id).map(e => {
                // Parse options if stored as string, though usually stored as text in DB but handled as array in frontend logic
                // Check if options is JSON string
                let opts = e.options;
                try { opts = JSON.parse(e.options); } catch {}
                
                return { ...e, options: opts };
            });

            return {
                ...m,
                content: JSON.parse(m.content || '{}'),
                exercises: moduleExercises
            };
        });

        fs.writeFileSync(outputPath, JSON.stringify(fullModules, null, 2));
        console.log(`Successfully exported ${fullModules.length} modules and ${exercises.length} exercises to ${outputPath}`);

    } catch (e) {
        console.error("Export failed:", e);
    } finally {
        db.close();
    }
}

exportData();
