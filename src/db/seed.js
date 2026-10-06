// Creates the MySQL schema and the MongoDB collections, then loads the same
// seed data as public/db.js. Safe to re-run: everything is dropped first.
const { getPool, createDatabase, closePool } = require('./mysql');
const { getDb, closeMongo } = require('./mongo');
const teamsRepo = require('./teamsRepo');
const usersRepo = require('./usersRepo');

const USERS = [
    { id: 'admin1', username: 'admin', password: 'admin123', role: 'admin', name: 'Competition Director' },
    { id: 'judge1', username: 'sharma', password: 'judge123', role: 'judge', name: 'Dr. Sharma' },
    { id: 'judge2', username: 'mehta', password: 'judge123', role: 'judge', name: 'Prof. Mehta' },
    { id: 'judge3', username: 'patel', password: 'judge123', role: 'judge', name: 'Dr. Patel' },
    { id: 'team_T001', username: 'nirma', password: 'team123', role: 'team', name: 'Team Nirma AUV', teamId: 'T001' },
    { id: 'team_T002', username: 'aquabots', password: 'team123', role: 'team', name: 'Team AquaBots', teamId: 'T002' }
];

const TEAMS = [
    { id: 'T001', name: 'Team Nirma AUV', university: 'Nirma University', category: 'Autonomous Underwater Vehicle', registeredOn: '2026-07-21' },
    { id: 'T002', name: 'Team AquaBots', university: 'IIT Delhi', category: 'Autonomous Underwater Vehicle', registeredOn: '2026-07-21' }
];

const PARTICIPANTS = [
    { rollNo: '21BCE001', firstName: 'Aarav', mobile: '9876543210', email: 'aarav@nirmauni.ac.in', address: 'Hostel B, Nirma University, Ahmedabad', teamId: 'T001', registeredOn: '2026-07-22' }
];

const SCORES = [
    { judgeId: 'judge1', teamId: 'T001', roundId: 'R1', criteria: { Autonomy: 8, Design: 7, Documentation: 9 }, submittedAt: '2026-08-15T10:00:00Z' },
    { judgeId: 'judge2', teamId: 'T001', roundId: 'R1', criteria: { Autonomy: 7, Design: 8, Documentation: 8 }, submittedAt: '2026-08-15T10:30:00Z' },
    { judgeId: 'judge3', teamId: 'T001', roundId: 'R1', criteria: { Autonomy: 9, Design: 7, Documentation: 9 }, submittedAt: '2026-08-15T11:00:00Z' }
];

async function seedMysql() {
    const name = await createDatabase();
    const pool = getPool();

    await pool.query('DROP TABLE IF EXISTS participants');
    await pool.query('DROP TABLE IF EXISTS users');
    await teamsRepo.dropTeamsTable();

    await teamsRepo.createTeamsTable();
    await usersRepo.createUsersTable();
    await pool.query(`
        CREATE TABLE participants (
            roll_no       VARCHAR(20)  PRIMARY KEY,
            first_name    VARCHAR(50)  NOT NULL,
            mobile        VARCHAR(15)  NOT NULL,
            email         VARCHAR(100) NOT NULL,
            address       VARCHAR(255) NOT NULL,
            team_id       VARCHAR(20)  NOT NULL,
            registered_on DATE         NOT NULL
        )`);

    for (const t of TEAMS) await teamsRepo.insertTeam(t);
    for (const u of USERS) await usersRepo.insertUser(u);
    for (const p of PARTICIPANTS) {
        await pool.query(
            'INSERT INTO participants VALUES (?, ?, ?, ?, ?, ?, ?)',
            [p.rollNo, p.firstName, p.mobile, p.email, p.address, p.teamId, p.registeredOn]
        );
    }
    console.log(`MySQL  "${name}": ${TEAMS.length} teams, ${USERS.length} users, ${PARTICIPANTS.length} participants`);
}

async function seedMongo() {
    const db = await getDb();
    await db.collection('scores').drop().catch(() => {});
    await db.collection('logs').drop().catch(() => {});

    await db.collection('scores').insertMany(SCORES.map(s => ({ ...s })));
    await db.collection('scores').createIndex({ judgeId: 1, teamId: 1, roundId: 1 }, { unique: true });
    await db.collection('logs').insertOne({
        action: 'system', userId: 'system',
        detail: 'RoboJudge database initialized with seed data',
        timestamp: new Date().toISOString()
    });
    console.log(`MongoDB "${db.databaseName}": ${SCORES.length} scores, 1 log`);
}

(async () => {
    try {
        await seedMysql();
        await seedMongo();
        console.log('Seed complete.');
    } catch (err) {
        console.error('Seed failed:', err.message);
        process.exitCode = 1;
    } finally {
        await closePool();
        await closeMongo();
    }
})();
