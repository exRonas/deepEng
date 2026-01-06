const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'db/deepeng.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('Migrating database: Adding phone column to users table...');

db.serialize(() => {
    // 1. Check if column exists (naive check by trying to select it or just try adding it)
    // SQLite doesn't have "IF NOT EXISTS" for ADD COLUMN in older versions, but we can try and catch
    
    db.run(`ALTER TABLE users ADD COLUMN phone TEXT UNIQUE`, (err) => {
        if (err) {
            if (err.message.includes('duplicate column name')) {
                console.log('Column "phone" already exists.');
            } else {
                console.error('Error adding phone column:', err.message);
            }
        } else {
            console.log('Successfully added "phone" column.');
        }
    });
    
    db.run(`ALTER TABLE users ADD COLUMN full_name TEXT`, (err) => {
        if (err) {
             if (err.message.includes('duplicate column name')) {
                console.log('Column "full_name" already exists.');
            } else {
                console.error('Error adding full_name column:', err.message);
            }
        } else {
            console.log('Successfully added "full_name" column.');
        }
    });

});

db.close(() => {
    console.log('Migration check complete.');
});
