const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, 'db/deepeng.sqlite');
const db = new sqlite3.Database(dbPath);

const TEACHER_NAME = "Main Teacher";
const TEACHER_USERNAME = "teacher";
const TEACHER_PASSWORD = "teacher_password_123"; // CHANGE THIS

async function createTeacher() {
    const hashedPassword = await bcrypt.hash(TEACHER_PASSWORD, 10);

    db.run(
        `INSERT INTO users (username, full_name, password, role, level) VALUES (?, ?, ?, ?, ?)`,
        [TEACHER_USERNAME, TEACHER_NAME, hashedPassword, 'teacher', 'C2'],
        function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    console.log(`Teacher '${TEACHER_USERNAME}' already exists. Updating password...`);
                    db.run(
                        `UPDATE users SET password = ?, role = 'teacher' WHERE username = ?`,
                        [hashedPassword, TEACHER_USERNAME],
                        (updateErr) => {
                           if (updateErr) console.error("Error updating teacher:", updateErr);
                           else console.log("Teacher password updated successfully.");
                        }
                    );
                } else {
                    console.error("Error creating teacher:", err);
                }
            } else {
                console.log(`Teacher '${TEACHER_USERNAME}' created successfully with ID: ${this.lastID}`);
            }
            db.close();
        }
    );
}

createTeacher();
