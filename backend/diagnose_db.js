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

        const requiredColumns = [
            'username', 'phone', 'full_name', 'password', 
            'role', 'level', 'teacher_id', 'created_at'
        ];

        let missingColumns = requiredColumns.filter(col => !columns.includes(col));
        
        console.log('Missing columns:', missingColumns);

        if (missingColumns.length > 0) {
            console.log('\n--- ATTEMPTING MIGRATION ---');
            
            if (missingColumns.includes('phone')) {
                console.log('Adding phone column (step 1/2)...');
                db.run("ALTER TABLE users ADD COLUMN phone TEXT", (e) => {
                    if (e) { console.log('Error adding phone: ' + e.message); }
                    else {
                        console.log('Phone column added. Creating UNIQUE index (step 2/2)...');
                        db.run("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone ON users(phone)", (err) => {
                             console.log(err ? 'Error creating index: ' + err.message : 'Successfully created UNIQUE index on phone');
                        });
                    }
                });
            }

            if (missingColumns.includes('full_name')) db.run("ALTER TABLE users ADD COLUMN full_name TEXT", logResult('full_name'));
            if (missingColumns.includes('password')) db.run("ALTER TABLE users ADD COLUMN password TEXT", logResult('password'));
            if (missingColumns.includes('role')) db.run("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'student'", logResult('role'));
            if (missingColumns.includes('level')) db.run("ALTER TABLE users ADD COLUMN level TEXT DEFAULT 'A1'", logResult('level'));
            if (missingColumns.includes('teacher_id')) db.run("ALTER TABLE users ADD COLUMN teacher_id INTEGER", logResult('teacher_id'));
            if (missingColumns.includes('created_at')) db.run("ALTER TABLE users ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP", logResult('created_at'));
            if (missingColumns.includes('username')) db.run("ALTER TABLE users ADD COLUMN username TEXT UNIQUE", logResult('username'));

        } else {
            console.log('\n✓ Database appears to be up to date.');
        }

        function logResult(col) {
            return (err) => console.log(err ? `Error adding ${col}: ${err.message}` : `Successfully added ${col} column`);
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
