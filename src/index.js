const { getAllTeams, getTeamById } = require('./models/team');

console.log("RoboJudge server logic initialized.");

console.log("All teams:", JSON.stringify(getAllTeams(), null, 2));

//multi-dimensional access
const team = getTeamById("T001");
console.log("T001's first round:", team.rounds[0].roundName);
console.log("T001's Autonomy score:", team.rounds[0].criteria[0].score);