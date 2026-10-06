// Activity log API, backed by MongoDB.
const express = require('express');
const { recentLogs } = require('../db/logsRepo');
const { authenticate, authorize } = require('../middleware/auth');
const { ACTIONS } = require('../../public/permissions');

const router = express.Router();

router.get('/', authenticate, authorize(ACTIONS.VIEW_LOGS), async (req, res) => {
    res.json(await recentLogs());
});

module.exports = router;
