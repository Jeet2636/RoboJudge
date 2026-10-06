// Teams API, backed by MySQL.
const express = require('express');
const teams = require('../db/teamsRepo');
const { addLog } = require('../db/logsRepo');
const { authenticate, authorize } = require('../middleware/auth');
const { ACTIONS } = require('../../public/permissions');

const router = express.Router();
router.use(authenticate);

router.get('/', async (req, res) => {
    res.json(await teams.selectTeams());
});

router.get('/universities', async (req, res) => {
    res.json(await teams.selectUniqueUniversities());
});

router.post('/', authorize(ACTIONS.MANAGE_TEAMS), async (req, res) => {
    const { id, name, university, category } = req.body || {};
    if (!id || !name || !university || !category) {
        return res.status(400).json({ error: 'id, name, university and category are required.' });
    }
    if (await teams.selectTeamById(id)) return res.status(409).json({ error: `Team ${id} already exists.` });

    const team = await teams.insertTeam({
        id, name, university, category,
        registeredOn: new Date().toISOString().split('T')[0]
    });
    await addLog('team_added', req.user.userId, `Team "${name}" registered`);
    res.status(201).json(team);
});

router.put('/:id', authorize(ACTIONS.MANAGE_TEAMS), async (req, res) => {
    const { name, university, category } = req.body || {};
    const team = await teams.updateTeam(req.params.id, { name, university, category });
    if (!team) return res.status(404).json({ error: 'Team not found.' });

    await addLog('team_updated', req.user.userId, `Team "${team.name}" updated`);
    res.json(team);
});

router.delete('/:id', authorize(ACTIONS.MANAGE_TEAMS), async (req, res) => {
    if (!(await teams.deleteTeam(req.params.id))) return res.status(404).json({ error: 'Team not found.' });

    await addLog('team_removed', req.user.userId, `Team ${req.params.id} removed`);
    res.status(204).end();
});

module.exports = router;
