// Scores collection (MongoDB). One document per judge + team + round:
// { judgeId, teamId, roundId, criteria: { Autonomy: 8, ... }, submittedAt }
const { ObjectId } = require('mongodb');
const { getDb } = require('./mongo');

async function scores() {
    return (await getDb()).collection('scores');
}

// Re-submitting replaces the judge's earlier score for that team and round,
// matching DB.submitScore in public/db.js.
async function createScore({ judgeId, teamId, roundId, criteria }) {
    const col = await scores();
    const doc = { judgeId, teamId, roundId, criteria, submittedAt: new Date().toISOString() };
    await col.replaceOne({ judgeId, teamId, roundId }, doc, { upsert: true });
    return col.findOne({ judgeId, teamId, roundId });
}

async function findScores(filter = {}) {
    return (await scores()).find(filter).sort({ submittedAt: -1 }).toArray();
}

async function updateScore(id, criteria) {
    if (!ObjectId.isValid(id)) return null;
    return (await scores()).findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { criteria, submittedAt: new Date().toISOString() } },
        { returnDocument: 'after' }
    );
}

async function deleteScore(id) {
    if (!ObjectId.isValid(id)) return false;
    const result = await (await scores()).deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
}

/**
 * A team's results, averaged across judges per round. The output never
 * contains a judgeId: teams must not learn which judge awarded what.
 */
async function aggregateForTeam(teamId) {
    const rows = await findScores({ teamId });
    const byRound = {};
    rows.forEach(s => {
        (byRound[s.roundId] = byRound[s.roundId] || []).push(s.criteria);
    });

    return Object.entries(byRound).map(([roundId, list]) => {
        const averages = {};
        Object.keys(list[0]).forEach(c => {
            const vals = list.map(crit => crit[c] || 0);
            averages[c] = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 10) / 10;
        });
        return { roundId, judgesCount: list.length, averages };
    });
}

module.exports = { createScore, findScores, updateScore, deleteScore, aggregateForTeam };
