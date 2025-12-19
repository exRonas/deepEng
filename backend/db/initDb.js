const { initDb } = require('./database');

initDb().catch(err => {
    console.error('Failed to initialize database:', err);
});
