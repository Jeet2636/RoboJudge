// Practical 8.II: Node.js + MySQL using user-defined functions
// (src/db/teamsRepo.js): delete record, select record, select unique, drop table.
const { closePool } = require('../db/mysql');
const teams = require('../db/teamsRepo');

(async () => {
    try {
        // Inserted here so the delete step always has a record to remove.
        await teams.createTeamsTable();
        const id = 'TDEL' + Date.now().toString().slice(-4);
        await teams.insertTeam({
            id, name: 'Team Temporary', university: 'IIT Delhi',
            category: 'Robo Soccer', registeredOn: new Date().toISOString().split('T')[0]
        });

        const deleted = await teams.deleteTeam(id);
        console.log(`1. deleteTeam("${id}") ->`, deleted ? 'deleted' : 'not found');

        console.log('2. selectTeams():');
        console.table(await teams.selectTeams());

        console.log('   selectTeamById("T001"):', await teams.selectTeamById('T001'));

        console.log('3. selectUniqueUniversities() (SELECT DISTINCT):', await teams.selectUniqueUniversities());

        await teams.dropTeamsTable();
        console.log('4. dropTeamsTable() -> table "teams" dropped.');
        console.log('\nRun "npm run db:init" to recreate and reseed the tables for the app.');
    } catch (err) {
        console.error('Practical 8.II failed:', err.message);
        process.exitCode = 1;
    } finally {
        await closePool();
    }
})();
