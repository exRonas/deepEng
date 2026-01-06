const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Determine path to DB
const dbPath = path.join(__dirname, 'db', 'deepeng.sqlite');

console.log('Diagnosis Script Started');
console.log('Looking for database at:', dbPath);

if (!fs.existsSync(dbPath)) {
    console.error('ERROR: Database file NOT FOUND at ' + dbPath);
    process.exit(1);
}

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.error('ERROR: Could not connect to database:', err.message);
        process.exit(1);
    }
    console.log('Connected to database.');
});

db.serialize(() => {
    // 1. Check current columns
    console.log('\n--- Current Schema for "users" table ---');
    db.all("PRAGMA table_info(users)", (err, rows) => {
        if (err) {
            console.error('Error fetching table info:', err);
            return;
        }
        
        const columns = rows.map(r => r.name);
        console.log('Columns found:', columns);

        const hasPhone = columns.includes('phone');
        const hasFullName = columns.includes('full_name');
        const hasTeacherId = columns.includes('teacher_id');

        console.log('Has "phone"?', hasPhone);
        console.log('Has "full_name"?', hasFullName);
        console.log('Has "teacher_id"?', hasTeacherId);

        if (!hasPhone || !hasFullName || !hasTeacherId) {
            console.log('\n--- ATTEMPTING MIGRATION ---');
            
            if (!hasPhone) {
                db.run("ALTER TABLE users ADD COLUMN phone TEXT UNIQUE", (e) => {
                    console.log(e ? 'Error adding phone: ' + e.message : 'Successfully added phone column');
                });
            }
            if (!hasFullName) {
                db.run("ALTER TABLE users ADD COLUMN full_name TEXT", (e) => {
                    console.log(e ? 'Error adding full_name: ' + e.message : 'Successfully added full_name column');
                });
            }
            if (!hasTeacherId) {
                db.run("ALTER TABLE users ADD COLUMN teacher_id INTEGER", (e) => {
                    console.log(e ? 'Error adding teacher_id: ' + e.message : 'Successfully added teacher_id column');
                });
            }
        } else {
            console.log('\n✓ Database appears to be up to date.');
        }
    });
});

// Close later
setTimeout(() => {
    db.close((err) => {
        if (err) console.error(err.message);
        console.log('Database connection closed.');
    });
}, 2000);
