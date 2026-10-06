const express = require('express');
const users = require('../db/usersRepo');
const { addLog } = require('../db/logsRepo');
const { signToken, authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/login', async (req, res) => {
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ error: 'Username and password are required.' });

    const user = await users.findByUsername(username);
    // Same message for an unknown user and a wrong password, so usernames can't be probed.
    if (!user || !(await users.checkPassword(user, password))) {
        return res.status(401).json({ error: 'Invalid username or password.' });
    }

    await addLog('login', user.id, `${user.name} signed in to the server console`);
    res.json({
        token: signToken(user),
        user: { userId: user.id, role: user.role, name: user.name, teamId: user.team_id || undefined }
    });
});

router.get('/me', authenticate, (req, res) => {
    res.json({ user: req.user });
});

module.exports = router;
