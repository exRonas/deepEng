const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'deepeng.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('Migrating progress table (full check)...');

const columnsToAdd = [
    { name: 'reflection', type: 'TEXT' },
    { name: 'details', type: 'TEXT' },
    { name: 'ai_history', type: 'TEXT' }
];

db.serialize(() => {
    columnsToAdd.forEach(col => {
        db.run(`ALTER TABLE progress ADD COLUMN ${col.name} ${col.type}`, (err) => {
            if (err && !err.message.includes('duplicate column')) {
                console.error(`Error adding ${col.name} column:`, err.message);
            } else {
                console.log(`Column '${col.name}' checked/added.`);
            }
        });
    });
});

db.close();
