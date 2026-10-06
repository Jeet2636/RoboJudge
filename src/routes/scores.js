// Scores API, backed by MongoDB. What GET returns depends on the role:
//   admin -> every score, with judge names
//   judge -> only the scores they submitted
//   team  -> only its own per-round averages, never per-judge scores
const express = require('express');
const scores = require('../db/scoresRepo');
const users = require('../db/usersRepo');
const { addLog } = require('../db/logsRepo');
const { authenticate, authorize } = require('../middleware/auth');
const { ACTIONS, Permissions } = require('../../public/permissions');

const CRITERIA = ['Autonomy', 'Design', 'Documentation'];

const router = express.Router();
router.use(authenticate);

// Returns the cleaned criteria object, or null if any score is missing or not 0-10.
function validCriteria(input) {
    if (!input || typeof input !== 'object') return null;
    const out = {};
    for (const c of CRITERIA) {
        const v = Number(input[c]);
        if (!Number.isFinite(v) || v < 0 || v > 10) return null;
        out[c] = v;
    }
    return out;
}

router.get('/', async (req, res) => {
    const { role, userId, teamId } = req.user;

    if (Permissions.can(role, ACTIONS.VIEW_ALL_SCORES)) {
        const [rows, judgeNames] = await Promise.all([scores.findScores(), users.findJudgeNames()]);
        return res.json(rows.map(s => ({ ...s, judgeName: judgeNames[s.judgeId] || s.judgeId })));
    }
    if (Permissions.can(role, ACTIONS.SUBMIT_SCORES)) {
        return res.json(await scores.findScores({ judgeId: userId }));
    }
    if (Permissions.can(role, ACTIONS.VIEW_OWN_TEAM_SCORES)) {
        return res.json(await scores.aggregateForTeam(teamId));
    }
    res.status(403).json({ error: 'Permission denied.' });
});

router.post('/', authorize(ACTIONS.SUBMIT_SCORES), async (req, res) => {
    const { teamId, roundId } = req.body || {};
    const criteria = validCriteria(req.body && req.body.criteria);
    if (!teamId || !roundId || !criteria) {
        return res.status(400).json({ error: `teamId, roundId and a 0-10 score for ${CRITERIA.join(', ')} are required.` });
    }

    // judgeId comes from the token, so a judge can never submit as someone else.
    const score = await scores.createScore({ judgeId: req.user.userId, teamId, roundId, criteria });
    await addLog('score_submitted', req.user.userId, `${req.user.name} scored ${teamId} in ${roundId}`);
    res.status(201).json(score);
});

router.put('/:id', authorize(ACTIONS.MANAGE_SCORES), async (req, res) => {
    const criteria = validCriteria(req.body && req.body.criteria);
    if (!criteria) return res.status(400).json({ error: `A 0-10 score for ${CRITERIA.join(', ')} is required.` });

    const score = await scores.updateScore(req.params.id, criteria);
    if (!score) return res.status(404).json({ error: 'Score not found.' });

    await addLog('score_updated', req.user.userId, `Score for ${score.teamId} in ${score.roundId} edited`);
    res.json(score);
});

router.delete('/:id', authorize(ACTIONS.MANAGE_SCORES), async (req, res) => {
    if (!(await scores.deleteScore(req.params.id))) return res.status(404).json({ error: 'Score not found.' });

    await addLog('score_deleted', req.user.userId, `Score ${req.params.id} deleted`);
    res.status(204).end();
});

module.exports = router;
