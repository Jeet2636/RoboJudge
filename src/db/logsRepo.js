// Activity log collection (MongoDB). Same shape as the logs in public/db.js.
const { getDb } = require('./mongo');

async function addLog(action, userId, detail) {
    await (await getDb()).collection('logs').insertOne({
        action, userId, detail, timestamp: new Date().toISOString()
    });
}

async function recentLogs(limit = 100) {
    return (await getDb()).collection('logs').find().sort({ timestamp: -1 }).limit(limit).toArray();
}

module.exports = { addLog, recentLogs };
