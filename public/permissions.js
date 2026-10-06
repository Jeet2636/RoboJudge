/**
 * Role-based access control (Practical 9).
 *
 * Single source of truth for who may see and do what. Navigation, page guards
 * and every mutating action read from the matrix below, so permissions cannot
 * drift apart between the menu and the logic behind it.
 *
 * Enforcement has two layers:
 *   1. The sidebar never renders a nav item the role is not allowed.
 *   2. Every action re-checks Permissions.can() before mutating data.
 *      Hiding a button is presentation, not access control.
 */
(function () {

    // Named capabilities that pages check before performing an operation.
    const ACTIONS = {
        MANAGE_TEAMS: "manage_teams",
        MANAGE_JUDGES: "manage_judges",
        MANAGE_ROUNDS: "manage_rounds",
        REORDER_ROUNDS: "reorder_rounds",
        GRANT_ROUND_ACCESS: "grant_round_access",
        VIEW_SCHEDULE: "view_schedule",
        MANAGE_PARTICIPANTS: "manage_participants",
        REGISTER_PARTICIPANT: "register_participant",
        SUBMIT_SCORES: "submit_scores",
        VENUE_CHECKIN: "venue_checkin",
        MANAGE_SCORES: "manage_scores",              // edit or delete a submitted score
        VIEW_ALL_SCORES: "view_all_scores",           // every judge's score, attributed
        VIEW_OWN_TEAM_SCORES: "view_own_team_scores", // aggregated only, no attribution
        VIEW_LEADERBOARD: "view_leaderboard",
        VIEW_JUDGE_PROGRESS: "view_judge_progress",
        EXPORT_SCORES: "export_scores",
        MANAGE_VENUE: "manage_venue",
        VIEW_LOGS: "view_logs",
        CHANGE_OWN_PASSWORD: "change_own_password"
    };

    /**
     * The access matrix. `nav` drives the sidebar and each entry's `id` matches
     * a section id on that role's dashboard.
     *
     * Two rules are deliberate rather than incidental:
     *   - Teams get VIEW_OWN_TEAM_SCORES, never VIEW_ALL_SCORES. A team sees its
     *     own aggregated results and never learns which judge awarded what.
     *   - VIEW_LEADERBOARD is admin-only. A judge who can see live standings
     *     mid-competition is liable to anchor on them.
     */
    const PERMISSIONS = {

        guest: {
            home: "index.html",
            pages: ["index.html", "login.html", "register.html"],
            nav: [],
            actions: [ACTIONS.REGISTER_PARTICIPANT]
        },

        team: {
            home: "team.html",
            pages: ["index.html", "register.html", "team.html"],
            nav: [
                { id: "overview", label: "Overview" },
                { id: "scores", label: "My scores" },
                { id: "profile", label: "Profile" }
            ],
            actions: [
                ACTIONS.VIEW_OWN_TEAM_SCORES,
                ACTIONS.REGISTER_PARTICIPANT,
                ACTIONS.CHANGE_OWN_PASSWORD
            ]
        },

        judge: {
            home: "judge.html",
            pages: ["index.html", "judge.html"],
            nav: [
                { id: "checkin", label: "Check-in" },
                { id: "scoring", label: "Scoring", requiresCheckin: true },
                { id: "rounds", label: "Schedule", requiresCheckin: true },
                { id: "profile", label: "Profile" }
            ],
            actions: [
                ACTIONS.VENUE_CHECKIN,
                ACTIONS.SUBMIT_SCORES,
                ACTIONS.VIEW_SCHEDULE,
                ACTIONS.CHANGE_OWN_PASSWORD
            ]
        },

        admin: {
            home: "admin.html",
            pages: ["index.html", "register.html", "admin.html"],
            nav: [
                { id: "teams", label: "Teams" },
                { id: "judges", label: "Judges" },
                { id: "schedule", label: "Schedule" },
                { id: "participants", label: "Participants" },
                { id: "allscores", label: "Scores" },
                { id: "leaderboard", label: "Leaderboard" },
                { id: "progress", label: "Judge progress" },
                { id: "settings", label: "Settings" },
                { id: "logs", label: "Activity log" },
                { id: "profile", label: "Profile" }
            ],
            actions: [
                ACTIONS.MANAGE_TEAMS,
                ACTIONS.MANAGE_JUDGES,
                ACTIONS.MANAGE_ROUNDS,
                ACTIONS.REORDER_ROUNDS,
                ACTIONS.GRANT_ROUND_ACCESS,
                ACTIONS.VIEW_SCHEDULE,
                ACTIONS.MANAGE_PARTICIPANTS,
                ACTIONS.REGISTER_PARTICIPANT,
                ACTIONS.MANAGE_SCORES,
                ACTIONS.VIEW_ALL_SCORES,
                ACTIONS.VIEW_LEADERBOARD,
                ACTIONS.VIEW_JUDGE_PROGRESS,
                ACTIONS.EXPORT_SCORES,
                ACTIONS.MANAGE_VENUE,
                ACTIONS.VIEW_LOGS,
                ACTIONS.CHANGE_OWN_PASSWORD
            ]
        }
    };

    function entry(role) {
        return PERMISSIONS[role] || PERMISSIONS.guest;
    }

    const Permissions = {

        ACTIONS: ACTIONS,
        MATRIX: PERMISSIONS,

        /** Where this role belongs when it has nowhere better to be. */
        homeFor(role) {
            return entry(role).home;
        },

        /** May this role perform this named action? */
        can(role, action) {
            return entry(role).actions.indexOf(action) !== -1;
        },

        /** May this role open this page? */
        canAccess(role, page) {
            return entry(role).pages.indexOf(page) !== -1;
        },

        /** Sidebar model for this role. */
        navFor(role) {
            return entry(role).nav.slice();
        },

        /** Display label for a role, used by the header badge. */
        labelFor(role) {
            return { admin: "Admin", judge: "Judge", team: "Team", guest: "Guest" }[role] || "Guest";
        },

        /** Current page filename, e.g. "admin.html". */
        currentPage() {
            const parts = window.location.pathname.split("/");
            return parts[parts.length - 1] || "index.html";
        }
    };

    // The same matrix guards the browser pages and the Express API
    // (src/middleware/auth.js), so the two can never disagree.
    if (typeof window !== "undefined") {
        window.ACTIONS = ACTIONS;
        window.Permissions = Permissions;
    }
    if (typeof module !== "undefined" && module.exports) {
        module.exports = { ACTIONS, Permissions };
    }
})();
