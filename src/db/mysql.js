const mysql = require('mysql2/promise');
require('dotenv').config({ quiet: true });

const config = {
    host: process.env.MYSQL_HOST || '127.0.0.1',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || ''
};
const DATABASE = process.env.MYSQL_DATABASE || 'robojudge';

let pool = null;

// The pool targets the robojudge database, so it must exist before first use.
function getPool() {
    if (!pool) pool = mysql.createPool({ ...config, database: DATABASE, connectionLimit: 10 });
    return pool;
}

// Connects without a database selected, since the database may not exist yet.
async function createDatabase() {
    const conn = await mysql.createConnection(config);
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${DATABASE}\``);
    await conn.end();
    return DATABASE;
}

async function closePool() {
    if (pool) await pool.end();
    pool = null;
}

module.exports = { getPool, createDatabase, closePool, DATABASE };
