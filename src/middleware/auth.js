// Practical 9, server side. Every API route goes through authenticate, and
// mutating routes also go through authorize(action), which checks the same
// access matrix the browser pages use (public/permissions.js).
const jwt = require('jsonwebtoken');
const { Permissions } = require('../../public/permissions');

const JWT_SECRET = process.env.JWT_SECRET || 'robojudge-dev-secret';

function signToken(user) {
    return jwt.sign(
        { userId: user.id, role: user.role, name: user.name, teamId: user.team_id || undefined },
        JWT_SECRET,
        { expiresIn: '2h' }
    );
}

function authenticate(req, res, next) {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Not signed in.' });

    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch {
        res.status(401).json({ error: 'Session expired or invalid. Please sign in again.' });
    }
}

function authorize(action) {
    return function (req, res, next) {
        if (!Permissions.can(req.user.role, action)) {
            return res.status(403).json({ error: `Permission denied: ${req.user.role} cannot ${action}.` });
        }
        next();
    };
}

module.exports = { signToken, authenticate, authorize };
