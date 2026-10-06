// RoboJudge API server: serves public/ and the /api routes.
// Teams and users live in MySQL (Practical 8), scores and logs in MongoDB
// (Practical 10), and every route is role-checked (Practical 9).
require('dotenv').config({ quiet: true });
const path = require('path');
const express = require('express');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/teams', require('./routes/teams'));
app.use('/api/scores', require('./routes/scores'));
app.use('/api/logs', require('./routes/logs'));

app.use('/api', (req, res) => {
    res.status(404).json({ error: 'No such API route.' });
});

// Express 5 forwards rejected async handlers here.
app.use((err, req, res, next) => {
    console.error(err);
    const dbDown = ['ECONNREFUSED', 'ER_ACCESS_DENIED_ERROR', 'ER_BAD_DB_ERROR', 'ER_NO_SUCH_TABLE'].includes(err.code)
        || err.name === 'MongoServerSelectionError';
    res.status(dbDown ? 503 : 500).json({
        error: dbDown ? 'Database unavailable. Is MySQL/MongoDB running and seeded (npm run db:init)?' : 'Internal server error.'
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`RoboJudge running at http://localhost:${PORT}`);
});
