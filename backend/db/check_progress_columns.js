const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'deepeng.sqlite');
const db = new sqlite3.Database(dbPath);

db.all("PRAGMA table_info(progress)", (err, rows) => {
    if (err) {
        console.error(err);
    } else {
        console.log('Columns in progress table:', rows.map(r => r.name));
    }
    db.close();
});