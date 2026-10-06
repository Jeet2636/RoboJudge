// Users table (MySQL). Passwords are stored only as bcrypt hashes.
const bcrypt = require('bcryptjs');
const { getPool } = require('./mysql');

async function createUsersTable() {
    await getPool().query(`
        CREATE TABLE IF NOT EXISTS users (
            id            VARCHAR(40)  PRIMARY KEY,
            username      VARCHAR(50)  NOT NULL UNIQUE,
            password_hash VARCHAR(100) NOT NULL,
            role          ENUM('admin', 'judge', 'team') NOT NULL,
            name          VARCHAR(100) NOT NULL,
            team_id       VARCHAR(20)  NULL
        )`);
}

async function insertUser(user) {
    const hash = await bcrypt.hash(user.password, 10);
    await getPool().query(
        'INSERT INTO users (id, username, password_hash, role, name, team_id) VALUES (?, ?, ?, ?, ?, ?)',
        [user.id, user.username, hash, user.role, user.name, user.teamId || null]
    );
}

async function findByUsername(username) {
    const [rows] = await getPool().query('SELECT * FROM users WHERE username = ?', [username]);
    return rows[0] || null;
}

async function findJudgeNames() {
    const [rows] = await getPool().query("SELECT id, name FROM users WHERE role = 'judge'");
    return Object.fromEntries(rows.map(r => [r.id, r.name]));
}

async function checkPassword(user, password) {
    return bcrypt.compare(password, user.password_hash);
}

module.exports = { createUsersTable, insertUser, findByUsername, findJudgeNames, checkPassword };
