const { MongoClient } = require('mongodb');
require('dotenv').config({ quiet: true });

const URL = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017';
const DB_NAME = process.env.MONGO_DB || 'robojudge';

let client = null;

async function getDb() {
    if (!client) {
        client = new MongoClient(URL);
        await client.connect();
    }
    return client.db(DB_NAME);
}

async function closeMongo() {
    if (client) await client.close();
    client = null;
}

module.exports = { getDb, closeMongo, DB_NAME };
