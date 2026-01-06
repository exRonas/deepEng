const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'deepeng.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('Migrating progress table...');

db.serialize(() => {
    db.run("ALTER TABLE progress ADD COLUMN details TEXT", (err) => {
        if (err && !err.message.includes('duplicate column')) {
            console.error('Error adding details column:', err.message);
        } else {
            console.log('Added details column (or already exists)');
        }
    });

    db.run("ALTER TABLE progress ADD COLUMN ai_history TEXT", (err) => {
        if (err && !err.message.includes('duplicate column')) {
            console.error('Error adding ai_history column:', err.message);
        } else {
            console.log('Added ai_history column (or already exists)');
        }
    });
});

db.close();
