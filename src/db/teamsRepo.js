// Teams table (MySQL). These are the user-defined functions used by
// Practical 8 and by the /api/teams routes.
const { getPool } = require('./mysql');

async function createTeamsTable() {
    await getPool().query(`
        CREATE TABLE IF NOT EXISTS teams (
            id            VARCHAR(20)  PRIMARY KEY,
            name          VARCHAR(100) NOT NULL,
            university    VARCHAR(100) NOT NULL,
            category      VARCHAR(100) NOT NULL,
            registered_on DATE         NOT NULL
        )`);
}

async function insertTeam(team) {
    await getPool().query(
        'INSERT INTO teams (id, name, university, category, registered_on) VALUES (?, ?, ?, ?, ?)',
        [team.id, team.name, team.university, team.category, team.registeredOn]
    );
    return selectTeamById(team.id);
}

// Only the fields that are passed in are changed.
async function updateTeam(id, fields) {
    const columns = { name: 'name', university: 'university', category: 'category' };
    const sets = [];
    const values = [];
    for (const key of Object.keys(columns)) {
        if (fields[key] !== undefined) {
            sets.push(`${columns[key]} = ?`);
            values.push(fields[key]);
        }
    }
    if (sets.length === 0) return selectTeamById(id);
    const [result] = await getPool().query(`UPDATE teams SET ${sets.join(', ')} WHERE id = ?`, [...values, id]);
    return result.affectedRows ? selectTeamById(id) : null;
}

async function deleteTeam(id) {
    const [result] = await getPool().query('DELETE FROM teams WHERE id = ?', [id]);
    return result.affectedRows > 0;
}

async function selectTeams() {
    const [rows] = await getPool().query(
        "SELECT id, name, university, category, DATE_FORMAT(registered_on, '%Y-%m-%d') AS registeredOn FROM teams ORDER BY id"
    );
    return rows;
}

async function selectTeamById(id) {
    const [rows] = await getPool().query(
        "SELECT id, name, university, category, DATE_FORMAT(registered_on, '%Y-%m-%d') AS registeredOn FROM teams WHERE id = ?",
        [id]
    );
    return rows[0] || null;
}

async function selectUniqueUniversities() {
    const [rows] = await getPool().query('SELECT DISTINCT university FROM teams ORDER BY university');
    return rows.map(r => r.university);
}

async function dropTeamsTable() {
    await getPool().query('DROP TABLE IF EXISTS teams');
}

module.exports = {
    createTeamsTable, insertTeam, updateTeam, deleteTeam,
    selectTeams, selectTeamById, selectUniqueUniversities, dropTeamsTable
};
