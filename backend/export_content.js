const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, 'db/deepeng.sqlite');
const outputPath = path.resolve(__dirname, 'content/modules.json');

const db = new sqlite3.Database(dbPath);

db.all("SELECT * FROM modules", (err, rows) => {
    if (err) {
        console.error(err);
        return;
    }

    // Process rows to parse the 'content' JSON string back into an object so the file is readable
    const processedRows = rows.map(row => {
        try {
            return {
                ...row,
                content: JSON.parse(row.content || '{}')
            };
        } catch (e) {
            return row;
        }
    });

    fs.writeFileSync(outputPath, JSON.stringify(processedRows, null, 2));
    console.log(`Successfully exported ${rows.length} modules to ${outputPath}`);
});
db.close();
