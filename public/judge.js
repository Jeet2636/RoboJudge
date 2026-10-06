/**
 * Judge dashboard.
 *
 * Practical 4.I  Geolocation API, used for venue check-in.
 * Practical 4.II Local Storage, used to autosave scores as they are entered.
 *
 * Scoring and the schedule stay locked until the judge is verified at the
 * venue, and a judge may only score the round that is currently running
 * (see DB.canJudgeScore).
 */

let session = null;
let shell = null;
let checkedIn = false;

// Practical 4.I: Geolocation API and venue check

function initCheckin() {
    const errorBox = document.getElementById("checkinError");
    const resultBox = document.getElementById("checkinResult");
    const retryBtn = document.getElementById("retryCheckinBtn");

    errorBox.classList.add("hidden");
    if (retryBtn) retryBtn.classList.add("hidden");
    resultBox.classList.add("hidden");

    setCheckedIn(false);
    setStatus("Locating…", "pending");

    if (!navigator.geolocation) {
        showCheckinError("Geolocation is not supported by your browser.");
        return;
    }

    navigator.geolocation.getCurrentPosition(
        function (position) {
            const currentLat = position.coords.latitude;
            const currentLng = position.coords.longitude;

            document.getElementById("lat").textContent = currentLat.toFixed(6);
            document.getElementById("lng").textContent = currentLng.toFixed(6);

            const venue = DB.getVenue();
            const dist = calculateDistance(currentLat, currentLng, venue.lat, venue.lng);

            // The map is only a visual aid — never let it block the check-in decision.
            try {
                initMap(currentLat, currentLng, venue);
            } catch (err) {
                console.error("Map could not be displayed:", err);
            }

            if (dist <= venue.radius) {
                setStatus("Checked in", "success");
                resultBox.classList.remove("hidden");
                setCheckedIn(true);
                UI.toast("You're checked in. Scoring is unlocked.", "success");
            } else {
                setStatus("Out of range", "error");
                setCheckedIn(false);
                showCheckinError(
                    `You are ${dist.toFixed(2)} km from the venue, and check-in needs you within ` +
                    `${venue.radius} km. Go to the venue, then try again.`
                );
            }
        },
        function (error) {
            let msg;
            switch (error.code) {
                case error.PERMISSION_DENIED:    msg = "Location access is blocked. Allow it in your browser's site settings, then try again."; break;
                case error.POSITION_UNAVAILABLE: msg = "Your device couldn't work out where you are. Turn on location services, then try again."; break;
                case error.TIMEOUT:              msg = "Finding your location took too long. Try again."; break;
                default:                         msg = "Your location couldn't be read. Try again.";
            }
            showCheckinError(msg);
            setStatus("Failed", "error");
            setCheckedIn(false);
        },
        // A venue geofence is kilometres wide, so network-level positioning is
        // plenty and resolves far more reliably than a fresh high-accuracy GPS
        // fix (which often times out indoors). A recent cached fix is fine too.
        { enableHighAccuracy: false, timeout: 20000, maximumAge: 60000 }
    );
}

const STATUS_CLASSES = {
    pending: "bg-rule-soft text-muted",
    success: "bg-final text-white",
    error:   "bg-danger text-white"
};

function setStatus(text, kind) {
    const el = document.getElementById("checkinStatus");
    if (!el) return;
    el.textContent = text;
    el.className = "inline-block rounded px-3 py-1 font-display text-lg font-semibold " +
        (STATUS_CLASSES[kind] || STATUS_CLASSES.pending);
}

/** Gate the Scoring and Schedule nav items behind a successful check-in. */
function setCheckedIn(value) {
    checkedIn = value;
    if (shell) shell.refresh();
}

let mapInstance = null;

function initMap(lat, lng, venue) {
    // Tear down the previous map before re-initialising (Retry Check-In)
    if (mapInstance) {
        mapInstance.remove();
        mapInstance = null;
    }

    const map = L.map("map").setView([venue.lat, venue.lng], 13);
    mapInstance = map;

    // Standard OSM tiles — no API key required (the CartoDB basemaps now are).
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19
    }).addTo(map);

    const venueCircle = L.circle([venue.lat, venue.lng], {
        color: "#13233A",
        weight: 2,
        fillColor: "#FFB000",
        fillOpacity: 0.18,
        radius: venue.radius * 1000 // metres
    }).addTo(map).bindPopup("Competition venue radius");

    const judgeMarker = L.marker([lat, lng]).addTo(map).bindPopup("Your location").openPopup();

    // These must be the layers already added to the map — a Circle that isn't
    // on a map has no projection and getBounds() throws.
    map.fitBounds(L.featureGroup([judgeMarker, venueCircle]).getBounds().pad(0.2));
}

/** Haversine distance in kilometres. */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function proceedToScoring() {
    shell.setActive("scoring");
    showSection("scoring");
}

function showCheckinError(msg) {
    const errorBox = document.getElementById("checkinError");
    const retryBtn = document.getElementById("retryCheckinBtn");
    errorBox.textContent = msg;
    errorBox.classList.remove("hidden");
    if (retryBtn) retryBtn.classList.remove("hidden");
}

// Scoring

function populateSelects() {
    const teams = DB.getTeams();
    const rounds = DB.getRounds();

    document.getElementById("teamSelect").innerHTML =
        teams.map(t => `<option value="${t.id}">${UI.escape(t.name)}</option>`).join("");

    // Locked rounds stay selectable so the judge can see why they are locked.
    document.getElementById("roundSelect").innerHTML = rounds.map(r => {
        const gate = DB.canJudgeScore(session.userId, r.id);
        const suffix = gate.allowed ? "" : " (locked)";
        return `<option value="${r.id}">${UI.escape(r.name)}${suffix}</option>`;
    }).join("");

    // Default to the round that's actually live, if there is one.
    const live = rounds.find(r => DB.canJudgeScore(session.userId, r.id).allowed);
    if (live) document.getElementById("roundSelect").value = live.id;
}

function getStorageKey() {
    const team = document.getElementById("teamSelect").value;
    const round = document.getElementById("roundSelect").value;
    return `robojudge_scores_${session.userId}_${team}_${round}`;
}

function loadScoreForm() {
    const container = document.getElementById("criteriaInputs");
    const lockNotice = document.getElementById("lockNotice");
    const actions = document.getElementById("scoreActions");
    container.innerHTML = "";

    const team = document.getElementById("teamSelect").value;
    const round = document.getElementById("roundSelect").value;
    if (!team || !round) return;

    // Round locking
    const gate = DB.canJudgeScore(session.userId, round);
    if (!gate.allowed) {
        lockNotice.innerHTML = `
            <div class="flex items-start gap-3 rounded-md border border-rule bg-floor p-4">
                <span class="mt-1 text-muted">${UI.ICONS.lock}</span>
                <div>
                    <p class="font-display text-xl font-semibold">This round is locked for you</p>
                    <p class="mt-0.5 text-muted">${UI.escape(gate.reason)}</p>
                </div>
            </div>`;
        lockNotice.classList.remove("hidden");
        actions.classList.add("hidden");
        updateAutosaveStatus("");
        return;
    }
    lockNotice.classList.add("hidden");
    actions.classList.remove("hidden");

    // Practical 4.II: restore from Local Storage, else from the database
    const saved = localStorage.getItem(getStorageKey());
    const dbScoresList = DB.getScores({ judgeId: session.userId, teamId: team, roundId: round });
    const dbScores = dbScoresList.length ? dbScoresList[dbScoresList.length - 1].criteria : {};

    let scores = {};
    let msg = "";
    if (saved) {
        scores = JSON.parse(saved);
        msg = "Restored your saved draft";
    } else if (Object.keys(dbScores).length > 0) {
        scores = dbScores;
        msg = "Showing the scores you already submitted";
    }

    DB.getCriteria().forEach(name => {
        const row = document.createElement("div");
        row.className = "flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-rule-soft py-4 last:border-0";

        const label = document.createElement("label");
        label.className = "w-full shrink-0 font-display text-xl font-semibold sm:w-40";
        label.htmlFor = `score_${name}`;
        label.textContent = name;

        const input = document.createElement("input");
        input.type = "range";
        input.min = "0";
        input.max = "10";
        input.step = "1";
        input.id = `score_${name}`;
        input.className = "score-range min-w-0 flex-1";
        input.value = scores[name] !== undefined ? scores[name] : "5";

        const val = document.createElement("span");
        val.className = "rj-digits w-14 shrink-0 rounded-md bg-board py-1.5 text-center text-3xl text-white";
        val.setAttribute("aria-hidden", "true");
        val.textContent = input.value;

        input.addEventListener("input", e => {
            val.textContent = e.target.value;
            autoSaveScores();
        });

        row.append(label, input, val);
        container.appendChild(row);
    });

    updateAutosaveStatus(msg);
}

function autoSaveScores() {
    const scores = {};
    DB.getCriteria().forEach(name => {
        const val = document.getElementById(`score_${name}`).value;
        if (val !== "") scores[name] = parseInt(val, 10);
    });
    localStorage.setItem(getStorageKey(), JSON.stringify(scores));
    updateAutosaveStatus("Draft saved");
}

async function clearSavedScores() {
    if (!await UI.confirm("Your unsubmitted scores for this team and round will be thrown away.",
                          { title: "Discard draft?", confirmText: "Discard draft" })) return;
    localStorage.removeItem(getStorageKey());
    loadScoreForm();
    UI.toast("Draft discarded.", "info");
}

function submitScores() {
    const criteria = DB.getCriteria();
    const scores = {};
    let valid = true;

    criteria.forEach(name => {
        const val = document.getElementById(`score_${name}`).value;
        if (val === "" || parseInt(val, 10) < 0 || parseInt(val, 10) > 10) valid = false;
        else scores[name] = parseInt(val, 10);
    });

    if (!valid) {
        UI.toast("Give every criterion a score from 0 to 10.", "error");
        return;
    }

    const team = document.getElementById("teamSelect").value;
    const round = document.getElementById("roundSelect").value;

    const result = DB.submitScore(session.userId, team, round, scores);
    if (!result.ok) {
        UI.toast(result.error, "error");
        loadScoreForm();
        return;
    }

    localStorage.removeItem(getStorageKey());
    updateAutosaveStatus("Submitted");
    UI.toast("Scores submitted.", "success");
    loadScoreForm();
}

function updateAutosaveStatus(msg) {
    const el = document.getElementById("autosaveStatus");
    if (!el) return;
    el.textContent = msg;
    el.className = /saved|Restored|Submitted/.test(msg)
        ? "text-sm font-semibold text-final"
        : "text-sm text-muted";
}

// Schedule. Read-only: the admin owns the round order.
// Practical 7: rendered with Vue, using three custom directives.

const PILL_CLASSES = { completed: "is-final", "in-progress": "is-live", upcoming: "is-upcoming" };

// Practical 7.I: click to switch the text between UPPERCASE and its original
// form. The directive owns the element's text: v-uppercase="round.name".
function renderUppercase(el, text) {
    el.textContent = el.dataset.upper ? String(text).toUpperCase() : text;
}
const uppercaseDirective = {
    mounted(el, binding) {
        el._text = binding.value;
        renderUppercase(el, el._text);
        el.addEventListener("click", function () {
            el.dataset.upper = el.dataset.upper ? "" : "1";
            renderUppercase(el, el._text);
        });
    },
    updated(el, binding) {
        el._text = binding.value;
        renderUppercase(el, el._text);
    }
};

// Practical 7.II: styles each item of the dynamic list from its round status,
// and restyles it whenever the list changes.
function applyStatus(el, binding) {
    const round = binding.value;
    const pill = el.querySelector("[data-status-pill]");

    el.classList.toggle("is-live", round.status === "in-progress");
    el.classList.toggle("opacity-60", !round.allowed);
    if (pill) {
        pill.classList.remove(...Object.values(PILL_CLASSES));
        pill.classList.add(PILL_CLASSES[round.status] || PILL_CLASSES.upcoming);
    }
}
const statusDirective = { mounted: applyStatus, updated: applyStatus };

// Practical 7.III: "2026-08-22" -> "22 Aug 2026, 3 days ago".
function applyDate(el, binding) {
    if (!binding.value) { el.textContent = "Date not set"; return; }

    const date = new Date(binding.value + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days = Math.round((date - today) / 86400000);

    let relative;
    if (days === 0) relative = "today";
    else if (days === 1) relative = "tomorrow";
    else if (days === -1) relative = "yesterday";
    else if (days > 0) relative = "in " + days + " days";
    else relative = Math.abs(days) + " days ago";

    el.textContent = formatDate(binding.value) + ", " + relative;
    el.title = date.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}
const dateDirective = { mounted: applyDate, updated: applyDate };

let roundsApp = null;

function mountRoundsApp() {
    roundsApp = Vue.createApp({
        data() {
            return {
                rounds: [],
                teamCount: 0,
                filter: "all",
                lockIcon: UI.ICONS.lock,
                filters: [
                    { id: "all", label: "All" },
                    { id: "open", label: "Open" },
                    { id: "locked", label: "Locked" }
                ]
            };
        },
        computed: {
            visibleRounds() {
                return this.rounds.filter(r => this.matches(r, this.filter));
            }
        },
        methods: {
            matches(r, filter) {
                if (filter === "open") return r.allowed;
                if (filter === "locked") return !r.allowed;
                return true;
            },
            countFor(filter) {
                return this.rounds.filter(r => this.matches(r, filter)).length;
            }
        }
    })
        .directive("uppercase", uppercaseDirective)
        .directive("status", statusDirective)
        .directive("date", dateDirective)
        .mount("#roundsApp");
}

function renderRoundsForJudge() {
    if (!roundsApp) mountRoundsApp();

    roundsApp.teamCount = DB.getTeams().length;
    roundsApp.rounds = DB.getRounds().map((r, i) => {
        const gate = DB.canJudgeScore(session.userId, r.id);
        return {
            id: r.id,
            name: r.name,
            date: r.date,
            status: r.status,
            statusText: { "in-progress": "Live", completed: "Final", upcoming: "Upcoming" }[r.status] || "Upcoming",
            sequenceNo: i + 1,
            allowed: gate.allowed,
            reason: gate.reason
        };
    });
}

function formatDate(dateStr) {
    if (!dateStr) return "";
    return new Date(dateStr + "T00:00:00")
        .toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

// Profile

function submitPasswordChange(e) {
    e.preventDefault();
    const current = document.getElementById("pwCurrent").value;
    const next = document.getElementById("pwNew").value;
    const confirmPw = document.getElementById("pwConfirm").value;

    if (next !== confirmPw) {
        UI.toast("The new passwords do not match.", "error");
        return;
    }

    const result = DB.changePassword(session.userId, current, next);
    if (!result.ok) {
        UI.toast(result.error, "error");
        return;
    }
    e.target.reset();
    UI.toast("Password updated.", "success");
}

// Sections

function showSection(id) {
    ["checkin", "scoring", "rounds", "profile"].forEach(s => {
        const el = document.getElementById(s);
        if (el) el.classList.toggle("hidden", s !== id);
    });
    if (id === "scoring") loadScoreForm();
    if (id === "rounds") renderRoundsForJudge();
}

// Init

document.addEventListener("DOMContentLoaded", function () {
    DB.init();
    session = DB.requireAuth(["judge"]);
    if (!session) return;

    shell = UI.mountShell({
        active: "checkin",
        onSelect: showSection,
        // Scoring and Schedule stay locked until the judge is at the venue.
        isEnabled: item => !item.requiresCheckin || checkedIn
    });

    document.getElementById("profileName").textContent = session.name;
    document.getElementById("profileUsername").textContent = "@" + session.username;
    document.getElementById("passwordForm").addEventListener("submit", submitPasswordChange);

    populateSelects();
    showSection("checkin");
    initCheckin();
});
