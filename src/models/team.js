const { readTeams, writeTeams } = require('../utils/fileHandler');

function getAllTeams() {
    return readTeams();
}

function getTeamById(teamId) {
    return readTeams().find(t => t.teamId === teamId);
}

function addTeam(newTeam) {
    const teams = readTeams();
    teams.push(newTeam);
    writeTeams(teams);
    return newTeam;
}

function addRoundScore(teamId, roundData) {
    const teams = readTeams();
    const team = teams.find(t => t.teamId === teamId);
    if (!team) throw new Error("Team not found");
    team.rounds.push(roundData);
    writeTeams(teams);
    return team;
}

module.exports = { getAllTeams, getTeamById, addTeam, addRoundScore };