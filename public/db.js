(function () {
    const DB_KEY = "robojudge_db";
    const SESSION_KEY = "robojudge_session";

    const SEED = {
        venue: { lat: 23.0305, lng: 72.5401, radius: 3 }, // default Ahmedabad, 3km
        users: [
            { id: "admin1", username: "admin", password: "admin123", role: "admin", name: "Competition Director" },
            { id: "judge1", username: "sharma", password: "judge123", role: "judge", name: "Dr. Sharma" },
            { id: "judge2", username: "mehta", password: "judge123", role: "judge", name: "Prof. Mehta" },
            { id: "judge3", username: "patel", password: "judge123", role: "judge", name: "Dr. Patel" },
            { id: "team_T001", username: "nirma", password: "team123", role: "team", name: "Team Nirma AUV", teamId: "T001" },
            { id: "team_T002", username: "aquabots", password: "team123", role: "team", name: "Team AquaBots", teamId: "T002" }
        ],
        teams: [
            { id: "T001", name: "Team Nirma AUV", university: "Nirma University", category: "Autonomous Underwater Vehicle", registeredOn: "2026-07-21" },
            { id: "T002", name: "Team AquaBots", university: "IIT Delhi", category: "Autonomous Underwater Vehicle", registeredOn: "2026-07-21" }
        ],
        rounds: [
            { id: "R1", name: "Prelims", date: "2026-08-15", status: "completed", sequence: 1 },
            { id: "R2", name: "Semis", date: "2026-08-22", status: "in-progress", sequence: 2 },
            { id: "R3", name: "Finals", date: "2026-08-29", status: "upcoming", sequence: 3 }
        ],
        criteria: ["Autonomy", "Design", "Documentation"],
        participants: [
            { rollNo: "21BCE001", firstName: "Aarav", mobile: "9876543210", email: "aarav@nirmauni.ac.in", address: "Hostel B, Nirma University, Ahmedabad", teamId: "T001", registeredOn: "2026-07-22" }
        ],
        scores: [
            { judgeId: "judge1", teamId: "T001", roundId: "R1", criteria: { Autonomy: 8, Design: 7, Documentation: 9 }, submittedAt: "2026-08-15T10:00:00Z" },
            { judgeId: "judge2", teamId: "T001", roundId: "R1", criteria: { Autonomy: 7, Design: 8, Documentation: 8 }, submittedAt: "2026-08-15T10:30:00Z" },
            { judgeId: "judge3", teamId: "T001", roundId: "R1", criteria: { Autonomy: 9, Design: 7, Documentation: 9 }, submittedAt: "2026-08-15T11:00:00Z" }
        ],
        // Per-judge exceptions letting a judge score a round that is otherwise
        // locked (see canJudgeScore). Granted by the admin.
        unlocks: [],
        logs: [
            { action: "system", userId: "system", detail: "RoboJudge database initialized with seed data", timestamp: "2026-07-21T09:00:00Z" }
        ]
    };

    function getData() {
        const raw = localStorage.getItem(DB_KEY);
        return raw ? JSON.parse(raw) : null;
    }

    function setData(data) {
        localStorage.setItem(DB_KEY, JSON.stringify(data));
    }

    window.DB = {

        init() {
            if (!getData()) setData(SEED);
        },

        getVenue() {
            const data = getData();
            return data.venue || { lat: 23.0305, lng: 72.5401, radius: 3 }; // default 3km
        },

        setVenue(lat, lng, radius) {
            const data = getData();
            data.venue = { lat: parseFloat(lat), lng: parseFloat(lng), radius: parseFloat(radius) };
            setData(data);
            this.addLog("system", `Venue updated to lat: ${lat}, lng: ${lng}, radius: ${radius}km`);
        },

        // Auth

        login(username, password) {
            const data = getData();
            const user = data.users.find(u => u.username === username && u.password === password);
            if (!user) return null;
            const session = { userId: user.id, username: user.username, role: user.role, name: user.name };
            if (user.teamId) session.teamId = user.teamId;
            localStorage.setItem(SESSION_KEY, JSON.stringify(session));
            this.addLog("login", user.name + " logged in");
            return session;
        },

        logout() {
            localStorage.removeItem(SESSION_KEY);
        },

        getSession() {
            const raw = localStorage.getItem(SESSION_KEY);
            return raw ? JSON.parse(raw) : null;
        },

        /**
         * Page guard. Not signed in at all -> login. Signed in but with the
         * wrong role -> their own dashboard, not the login page (bouncing a
         * logged-in user to a login form is confusing and looks broken).
         */
        requireAuth(allowedRoles) {
            const session = this.getSession();

            if (!session) {
                window.location.href = "login.html";
                return null;
            }

            if (allowedRoles && !allowedRoles.includes(session.role)) {
                const home = window.Permissions
                    ? window.Permissions.homeFor(session.role)
                    : "login.html";
                window.location.href = home;
                return null;
            }

            return session;
        },

        /** Guard a named action; throws so a blocked mutation is never silent. */
        requirePermission(action) {
            const session = this.getSession();
            const role = session ? session.role : "guest";
            if (!window.Permissions || !window.Permissions.can(role, action)) {
                throw new Error("Permission denied: " + action);
            }
            return session;
        },

        changePassword(userId, currentPassword, newPassword) {
            const data = getData();
            const user = data.users.find(u => u.id === userId);
            if (!user) return { ok: false, error: "User not found." };
            if (user.password !== currentPassword) return { ok: false, error: "Current password is incorrect." };
            if (!newPassword || newPassword.length < 5) return { ok: false, error: "New password must be at least 5 characters." };
            if (newPassword === currentPassword) return { ok: false, error: "New password must be different from the current one." };
            user.password = newPassword;
            setData(data);
            this.addLog("password_changed", user.name + " changed their password");
            return { ok: true };
        },

        // Teams

        getTeams() {
            return getData().teams;
        },

        getTeamById(id) {
            return getData().teams.find(t => t.id === id);
        },

        addTeam(team) {
            const data = getData();
            const credentials = { username: team.id.toLowerCase(), password: "team123" };
            data.teams.push(team);
            data.users.push({
                id: "team_" + team.id,
                username: credentials.username,
                password: credentials.password,
                role: "team",
                name: team.name,
                teamId: team.id
            });
            setData(data);
            this.addLog("team_added", "Team \"" + team.name + "\" registered");
            return credentials;
        },

        removeTeam(teamId) {
            const data = getData();
            const team = data.teams.find(t => t.id === teamId);
            data.teams = data.teams.filter(t => t.id !== teamId);
            data.users = data.users.filter(u => u.teamId !== teamId);
            data.scores = data.scores.filter(s => s.teamId !== teamId);
            data.participants = (data.participants || []).filter(p => p.teamId !== teamId);
            setData(data);
            if (team) this.addLog("team_removed", "Team \"" + team.name + "\" removed");
        },

        // Judges

        getJudges() {
            return getData().users.filter(u => u.role === "judge");
        },

        addJudge(judge) {
            const data = getData();
            data.users.push({
                id: judge.id,
                username: judge.username,
                password: judge.password,
                role: "judge",
                name: judge.name
            });
            setData(data);
            this.addLog("judge_added", "Judge \"" + judge.name + "\" added");
        },

        removeJudge(judgeId) {
            const data = getData();
            const judge = data.users.find(u => u.id === judgeId);
            data.users = data.users.filter(u => u.id !== judgeId);
            data.scores = data.scores.filter(s => s.judgeId !== judgeId);
            data.unlocks = (data.unlocks || []).filter(u => u.judgeId !== judgeId);
            setData(data);
            if (judge) this.addLog("judge_removed", "Judge \"" + judge.name + "\" removed");
        },

        // Rounds

        getRounds() {
            return getData().rounds.sort(function (a, b) { return a.sequence - b.sequence; });
        },

        addRound(round) {
            const data = getData();
            round.sequence = data.rounds.length + 1;
            data.rounds.push(round);
            setData(data);
            this.addLog("round_added", "Round \"" + round.name + "\" added");
        },

        removeRound(roundId) {
            const data = getData();
            const round = data.rounds.find(r => r.id === roundId);
            data.rounds = data.rounds.filter(r => r.id !== roundId);
            data.rounds.sort(function (a, b) { return a.sequence - b.sequence; })
                .forEach(function (r, i) { r.sequence = i + 1; });
            data.scores = data.scores.filter(s => s.roundId !== roundId);
            data.unlocks = (data.unlocks || []).filter(u => u.roundId !== roundId);
            setData(data);
            if (round) this.addLog("round_removed", "Round \"" + round.name + "\" removed");
        },

        updateRoundOrder(orderedIds) {
            const data = getData();
            orderedIds.forEach(function (id, i) {
                const round = data.rounds.find(r => r.id === id);
                if (round) round.sequence = i + 1;
            });
            setData(data);
            this.addLog("rounds_reordered", "Round sequence updated");
        },

        updateRoundStatus(roundId, status) {
            const data = getData();
            const round = data.rounds.find(r => r.id === roundId);
            if (round) {
                round.status = status;
                setData(data);
                this.addLog("round_status", "Round \"" + round.name + "\" set to " + status);
            }
        },

        // Round locking

        /**
         * Judges score the round that is actually running. Rounds that have not
         * started, or that are already closed, are locked — unless the admin has
         * granted this specific judge access to that specific round.
         *
         * Returns { allowed, reason } so callers can explain the lock.
         */
        canJudgeScore(judgeId, roundId) {
            const data = getData();
            const round = data.rounds.find(r => r.id === roundId);

            if (!round) return { allowed: false, reason: "That round no longer exists." };

            if (round.status === "in-progress") {
                return { allowed: true, reason: "Round is live." };
            }

            const granted = (data.unlocks || []).some(
                u => u.judgeId === judgeId && u.roundId === roundId
            );
            if (granted) {
                return { allowed: true, reason: "Access granted by the admin." };
            }

            if (round.status === "upcoming") {
                return { allowed: false, reason: "This round hasn't started yet." };
            }
            return { allowed: false, reason: "This round is closed — ask the admin for access." };
        },

        hasRoundAccess(judgeId, roundId) {
            return (getData().unlocks || []).some(
                u => u.judgeId === judgeId && u.roundId === roundId
            );
        },

        grantRoundAccess(judgeId, roundId) {
            const data = getData();
            if (!data.unlocks) data.unlocks = [];
            if (data.unlocks.some(u => u.judgeId === judgeId && u.roundId === roundId)) return;
            data.unlocks.push({ judgeId: judgeId, roundId: roundId, grantedAt: new Date().toISOString() });
            setData(data);

            const judge = data.users.find(u => u.id === judgeId);
            const round = data.rounds.find(r => r.id === roundId);
            this.addLog("access_granted",
                "Scoring access to \"" + (round ? round.name : roundId) + "\" granted to " +
                (judge ? judge.name : judgeId));
        },

        revokeRoundAccess(judgeId, roundId) {
            const data = getData();
            data.unlocks = (data.unlocks || []).filter(
                u => !(u.judgeId === judgeId && u.roundId === roundId)
            );
            setData(data);

            const judge = data.users.find(u => u.id === judgeId);
            const round = data.rounds.find(r => r.id === roundId);
            this.addLog("access_revoked",
                "Scoring access to \"" + (round ? round.name : roundId) + "\" revoked from " +
                (judge ? judge.name : judgeId));
        },

        // Scores

        getScores(filters) {
            var scores = getData().scores;
            if (filters) {
                if (filters.teamId) scores = scores.filter(s => s.teamId === filters.teamId);
                if (filters.judgeId) scores = scores.filter(s => s.judgeId === filters.judgeId);
                if (filters.roundId) scores = scores.filter(s => s.roundId === filters.roundId);
            }
            return scores;
        },

        submitScore(judgeId, teamId, roundId, criteriaScores) {
            // Enforced here, not just in the UI — a locked round must stay locked
            // even if submitScore is called directly.
            const gate = this.canJudgeScore(judgeId, roundId);
            if (!gate.allowed) {
                return { ok: false, error: gate.reason };
            }

            const data = getData();
            data.scores = data.scores.filter(s =>
                !(s.judgeId === judgeId && s.teamId === teamId && s.roundId === roundId)
            );
            data.scores.push({
                judgeId: judgeId,
                teamId: teamId,
                roundId: roundId,
                criteria: criteriaScores,
                submittedAt: new Date().toISOString()
            });
            setData(data);

            const judge = data.users.find(u => u.id === judgeId);
            const team = data.teams.find(t => t.id === teamId);
            const round = data.rounds.find(r => r.id === roundId);
            this.addLog("score_submitted", (judge ? judge.name : judgeId) + " scored " + (team ? team.name : teamId) + " in " + (round ? round.name : roundId));
            return { ok: true };
        },

        // Reporting

        /**
         * Team standings. Admin-only surface: teams never see rankings, and
         * judges are kept away from live standings so they don't anchor on them.
         */
        getLeaderboard() {
            const data = getData();
            const criteria = data.criteria;

            const rows = data.teams.map(team => {
                const perRound = [];
                let sum = 0;

                data.rounds.forEach(round => {
                    const roundScores = data.scores.filter(
                        s => s.teamId === team.id && s.roundId === round.id
                    );
                    if (roundScores.length === 0) return;

                    // Average each criterion across judges, then average the criteria.
                    const criteriaAvg = criteria.map(c => {
                        const vals = roundScores.map(s => s.criteria[c] || 0);
                        return vals.reduce((a, b) => a + b, 0) / vals.length;
                    });
                    const roundAvg = criteriaAvg.reduce((a, b) => a + b, 0) / criteria.length;

                    perRound.push({ roundId: round.id, roundName: round.name, average: roundAvg });
                    sum += roundAvg;
                });

                return {
                    teamId: team.id,
                    teamName: team.name,
                    university: team.university,
                    roundsScored: perRound.length,
                    average: perRound.length ? sum / perRound.length : 0,
                    perRound: perRound
                };
            });

            // Highest average first; teams with no scores sink to the bottom.
            rows.sort((a, b) => {
                if (b.roundsScored === 0 && a.roundsScored === 0) return 0;
                if (a.roundsScored === 0) return 1;
                if (b.roundsScored === 0) return -1;
                return b.average - a.average;
            });

            rows.forEach((r, i) => { r.rank = r.roundsScored ? i + 1 : null; });
            return rows;
        },

        /** Which judge has scored which team, per round — so gaps can be chased. */
        getJudgeProgress() {
            const data = getData();
            const judges = data.users.filter(u => u.role === "judge");

            return data.rounds.map(round => ({
                roundId: round.id,
                roundName: round.name,
                status: round.status,
                judges: judges.map(judge => ({
                    judgeId: judge.id,
                    judgeName: judge.name,
                    scored: data.teams.map(team => ({
                        teamId: team.id,
                        teamName: team.name,
                        done: data.scores.some(
                            s => s.judgeId === judge.id && s.teamId === team.id && s.roundId === round.id
                        )
                    }))
                })),
                totalExpected: judges.length * data.teams.length,
                totalDone: data.scores.filter(s => s.roundId === round.id).length
            }));
        },

        /** All scores as CSV text (admin export). */
        exportScoresCsv() {
            const data = getData();
            const criteria = data.criteria;
            const esc = v => {
                const s = String(v == null ? "" : v);
                return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
            };

            const header = ["Judge", "Team", "University", "Round", ...criteria, "Total", "Submitted"];
            const rows = data.scores.map(s => {
                const judge = data.users.find(u => u.id === s.judgeId);
                const team = data.teams.find(t => t.id === s.teamId);
                const round = data.rounds.find(r => r.id === s.roundId);
                const vals = criteria.map(c => s.criteria[c] || 0);
                return [
                    judge ? judge.name : s.judgeId,
                    team ? team.name : s.teamId,
                    team ? team.university : "",
                    round ? round.name : s.roundId,
                    ...vals,
                    vals.reduce((a, b) => a + b, 0),
                    s.submittedAt
                ];
            });

            return [header, ...rows].map(r => r.map(esc).join(",")).join("\n");
        },

        // Participants (Practical 5.III registration form)

        getParticipants() {
            return getData().participants || [];
        },

        addParticipant(participant) {
            const data = getData();
            if (!data.participants) data.participants = [];
            data.participants.push(participant);
            setData(data);
            this.addLog("participant_added", "Participant \"" + participant.firstName + "\" (" + participant.rollNo + ") registered");
        },

        removeParticipant(rollNo) {
            const data = getData();
            const participant = (data.participants || []).find(p => p.rollNo === rollNo);
            data.participants = (data.participants || []).filter(p => p.rollNo !== rollNo);
            setData(data);
            if (participant) this.addLog("participant_removed", "Participant \"" + participant.firstName + "\" removed");
        },

        // Criteria

        getCriteria() {
            return getData().criteria;
        },

        // Logs

        addLog(action, detail) {
            const data = getData();
            const session = this.getSession();
            data.logs.unshift({
                action: action,
                userId: session ? session.userId : "system",
                detail: detail,
                timestamp: new Date().toISOString()
            });
            if (data.logs.length > 100) data.logs = data.logs.slice(0, 100);
            setData(data);
        },

        getLogs() {
            return getData().logs;
        },

        // Utility

        resetDB() {
            localStorage.removeItem(DB_KEY);
            localStorage.removeItem(SESSION_KEY);
            this.init();
        }
    };

    DB.init();
})();
