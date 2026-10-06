const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '../../data/team.json');

function readTeams() {
    const raw = fs.readFileSync(DATA_PATH, 'utf8');
    return JSON.parse(raw);
}

function writeTeams(teams) {
    fs.writeFileSync(DATA_PATH, JSON.stringify(teams, null, 2));
}

module.exports = { readTeams, writeTeams };