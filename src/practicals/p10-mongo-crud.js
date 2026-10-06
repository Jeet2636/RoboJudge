// Practical 10: Node.js + MongoDB CRUD on the "scores" collection.
// Works on its own demo round ("R-DEMO") so the seeded scores are left alone.
const { getDb, closeMongo } = require('../db/mongo');

(async () => {
    try {
        const scores = (await getDb()).collection('scores');
        const ROUND = 'R-DEMO';
        await scores.deleteMany({ roundId: ROUND });

        // Create
        const one = await scores.insertOne({
            judgeId: 'judge1', teamId: 'T002', roundId: ROUND,
            criteria: { Autonomy: 6, Design: 7, Documentation: 8 },
            submittedAt: new Date().toISOString()
        });
        console.log('CREATE insertOne  -> _id', one.insertedId.toString());

        const many = await scores.insertMany([
            { judgeId: 'judge2', teamId: 'T002', roundId: ROUND, criteria: { Autonomy: 7, Design: 6, Documentation: 7 }, submittedAt: new Date().toISOString() },
            { judgeId: 'judge3', teamId: 'T002', roundId: ROUND, criteria: { Autonomy: 8, Design: 8, Documentation: 6 }, submittedAt: new Date().toISOString() }
        ]);
        console.log('CREATE insertMany ->', many.insertedCount, 'documents');

        // Read
        const all = await scores.find({ roundId: ROUND }).toArray();
        console.log(`READ   find({ roundId: "${ROUND}" }) ->`, all.length, 'documents');
        console.table(all.map(s => ({ judgeId: s.judgeId, teamId: s.teamId, ...s.criteria })));

        const high = await scores.find({ roundId: ROUND, 'criteria.Autonomy': { $gte: 7 } }).toArray();
        console.log('READ   find(Autonomy >= 7) ->', high.map(s => s.judgeId));

        // Update
        const upd = await scores.updateOne(
            { _id: one.insertedId },
            { $set: { 'criteria.Design': 9, submittedAt: new Date().toISOString() } }
        );
        console.log('UPDATE updateOne  -> modified', upd.modifiedCount, '| now:', (await scores.findOne({ _id: one.insertedId })).criteria);

        // Delete
        const del = await scores.deleteOne({ _id: one.insertedId });
        console.log('DELETE deleteOne  -> deleted', del.deletedCount);

        const cleanup = await scores.deleteMany({ roundId: ROUND });
        console.log('DELETE deleteMany -> cleaned up', cleanup.deletedCount, 'demo documents');
    } catch (err) {
        console.error('Practical 10 failed:', err.message);
        process.exitCode = 1;
    } finally {
        await closeMongo();
    }
})();
