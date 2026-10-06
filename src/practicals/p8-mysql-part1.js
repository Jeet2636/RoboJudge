// Practical 8.I: Node.js + MySQL
// Create a database, create a table, insert a record and update the record.
const { createDatabase, closePool } = require('../db/mysql');
const teams = require('../db/teamsRepo');

(async () => {
    try {
        const name = await createDatabase();
        console.log(`1. Database "${name}" created (or already existed).`);

        await teams.createTeamsTable();
        console.log('2. Table "teams" created (or already existed).');

        const id = 'T' + Date.now().toString().slice(-6);
        const inserted = await teams.insertTeam({
            id,
            name: 'Team RoboRiders',
            university: 'Nirma University',
            category: 'Line Follower',
            registeredOn: new Date().toISOString().split('T')[0]
        });
        console.log('3. Record inserted:', inserted);

        const updated = await teams.updateTeam(id, { name: 'Team RoboRiders X', category: 'Maze Solver' });
        console.log('4. Record updated:', updated);
    } catch (err) {
        console.error('Practical 8.I failed:', err.message);
        process.exitCode = 1;
    } finally {
        await closePool();
    }
})();
