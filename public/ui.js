/**
 * Shared UI kit: application chrome, toasts and confirm dialogs.
 *
 * The chrome is styled with its own `rj-` tokens rather than Bootstrap or
 * Tailwind utilities. The site is split across two frameworks (Tailwind for the
 * public and user surfaces, Bootstrap for the admin console) and the shell must
 * look identical on both halves. Each framework still styles its own page
 * content; only the chrome is shared.
 *
 * The sidebar is built from Permissions.navFor(role), so a role can never be
 * shown a destination it is not allowed to reach.
 */
(function () {

    // Tokens (--rj-*) live in theme.css, which every page links.
    const STYLES = `
    :root { --rj-sidebar-w: 236px; }

    .rj-shell { display: flex; min-height: 100vh; font-family: var(--rj-font); }

    /* Sidebar: the scoreboard rail */
    .rj-sidebar {
        width: var(--rj-sidebar-w); flex-shrink: 0;
        background: var(--rj-board); color: var(--rj-board-text);
        display: flex; flex-direction: column;
        position: sticky; top: 0; height: 100vh; z-index: 40;
        /* If the rail is taller than the window, the whole rail scrolls,
           with a thin scrollbar in the rail's own colours. */
        overflow-y: auto; overscroll-behavior: contain;
        scrollbar-width: thin; scrollbar-color: var(--rj-board-2) transparent;
    }
    .rj-sidebar::-webkit-scrollbar { width: 6px; }
    .rj-sidebar::-webkit-scrollbar-track { background: transparent; }
    .rj-sidebar::-webkit-scrollbar-thumb { background: var(--rj-board-2); border-radius: 3px; }
    .rj-sidebar-brand { padding: 20px 20px 12px; }
    .rj-wordmark {
        font-family: var(--rj-display); font-weight: 700; font-size: 1.7rem;
        line-height: 1; color: #fff; text-decoration: none; letter-spacing: -.01em;
    }
    .rj-wordmark:hover { color: #fff; }
    .rj-role { display: block; margin-top: 6px; font-size: .85rem; color: var(--rj-board-muted); }
    .rj-nav { padding: 4px 10px; display: flex; flex-direction: column; gap: 1px; flex: 1 0 auto; }
    .rj-nav-item {
        display: flex; align-items: center; gap: 10px;
        padding: 7px 12px; border-radius: var(--rj-radius);
        color: var(--rj-board-text); font-size: .95rem; font-weight: 500;
        background: none; border: 0; width: 100%; text-align: left;
        cursor: pointer; font-family: inherit;
    }
    .rj-nav-item:hover:not(:disabled) { background: var(--rj-board-2); }
    .rj-nav-item.active {
        background: var(--rj-board-2); color: #fff; font-weight: 600;
        box-shadow: inset 3px 0 0 var(--rj-signal);
    }
    .rj-nav-item:disabled { opacity: .4; cursor: not-allowed; }
    .rj-nav-lock { margin-left: auto; display: inline-flex; }

    .rj-now { margin: 8px 10px 10px; padding: 10px 14px; border-radius: var(--rj-radius); background: var(--rj-board-2); }
    .rj-now-label { display: flex; align-items: center; gap: 7px; font-size: .8rem; color: var(--rj-board-muted); }
    .rj-now .rj-live-dot { background: var(--rj-signal); }
    .rj-now-round { display: block; margin-top: 4px; font-family: var(--rj-display); font-size: 1.35rem; font-weight: 600; color: #fff; line-height: 1.1; }
    .rj-now-seq { font-size: .8rem; color: var(--rj-board-muted); }

    .rj-sidebar-foot { padding: 10px; border-top: 1px solid rgba(255,255,255,.08); }
    .rj-logout {
        display: flex; align-items: center; gap: 10px; width: 100%;
        padding: 9px 12px; border-radius: var(--rj-radius); border: 0; cursor: pointer;
        background: none; color: var(--rj-board-muted);
        font-family: inherit; font-size: .9rem; font-weight: 500;
    }
    .rj-logout:hover { background: var(--rj-board-2); color: #fff; }

    /* Main column */
    .rj-main { flex: 1; min-width: 0; display: flex; flex-direction: column; background: var(--rj-floor); }
    .rj-header {
        background: var(--rj-floor); border-bottom: 1px solid var(--rj-rule);
        padding: 0 28px; height: 64px; display: flex; align-items: center;
        gap: 14px; position: sticky; top: 0; z-index: 30;
    }
    .rj-hamburger {
        display: none; background: none; border: 0; cursor: pointer;
        color: var(--rj-ink); padding: 4px 6px; line-height: 0;
    }
    .rj-page-title {
        font-family: var(--rj-display); font-size: 1.6rem; font-weight: 600;
        color: var(--rj-ink); margin: 0; line-height: 1;
    }
    .rj-header-right { margin-left: auto; display: flex; align-items: center; gap: 10px; }
    .rj-user { font-size: .9rem; color: var(--rj-muted); }
    .rj-user strong { color: var(--rj-ink); font-weight: 600; }
    .rj-avatar {
        width: 34px; height: 34px; border-radius: var(--rj-radius); display: grid; place-items: center;
        background: var(--rj-board); color: #fff; font-family: var(--rj-display);
        font-weight: 600; font-size: .95rem;
    }
    .rj-content { flex: 1; padding: 28px 28px 48px; }
    .rj-footer {
        border-top: 1px solid var(--rj-rule); padding: 18px 28px;
        font-size: .85rem; color: var(--rj-muted);
        display: flex; flex-wrap: wrap; gap: 6px 18px; font-family: var(--rj-font);
    }
    .rj-footer a { color: var(--rj-ink); text-decoration: none; font-weight: 600; }
    .rj-footer a:hover { text-decoration: underline; }

    /* Public navbar */
    .rj-public-nav { background: var(--rj-floor); border-bottom: 1px solid var(--rj-rule); }
    .rj-public-inner {
        max-width: 1152px; margin: 0 auto; padding: 0 20px; height: 64px;
        display: flex; align-items: center; gap: 8px; font-family: var(--rj-font);
    }
    .rj-public-inner .rj-wordmark { color: var(--rj-ink); margin-right: auto; }
    .rj-btn {
        display: inline-block; padding: 8px 16px; border-radius: var(--rj-radius);
        font-size: .95rem; font-weight: 600; text-decoration: none; cursor: pointer;
        border: 1px solid transparent; font-family: var(--rj-font); line-height: 1.4;
    }
    .rj-btn-solid { background: var(--rj-board); color: #fff; }
    .rj-btn-solid:hover { background: #0B1626; color: #fff; }
    .rj-btn-ghost { color: var(--rj-ink); }
    .rj-btn-ghost:hover { background: var(--rj-rule-soft); color: var(--rj-ink); }

    /* Toasts */
    .rj-toasts {
        position: fixed; top: 16px; right: 16px; z-index: 9999;
        display: flex; flex-direction: column; gap: 8px;
        max-width: min(380px, calc(100vw - 32px));
    }
    .rj-toast {
        display: flex; align-items: flex-start; gap: 10px;
        background: var(--rj-board); color: var(--rj-board-text);
        border-radius: var(--rj-radius); padding: 12px 14px; font-family: var(--rj-font);
        font-size: .92rem; box-shadow: 0 10px 28px -10px rgba(19,35,58,.55);
        border-left: 4px solid var(--rj-board-muted);
        animation: rj-slide-in .2s ease-out;
    }
    .rj-toast.leaving { animation: rj-slide-out .18s ease-in forwards; }
    .rj-toast.success { border-left-color: #4CC38A; }
    .rj-toast.error   { border-left-color: #FF6B5E; }
    .rj-toast.warning { border-left-color: var(--rj-signal); }
    .rj-toast-msg { flex: 1; line-height: 1.45; }
    .rj-toast-close {
        background: none; border: 0; cursor: pointer; color: var(--rj-board-muted);
        padding: 2px 0 0; line-height: 0;
    }
    @keyframes rj-slide-in  { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: none; } }
    @keyframes rj-slide-out { to { opacity: 0; transform: translateY(-8px); } }

    /* Confirm dialog */
    .rj-overlay {
        position: fixed; inset: 0; z-index: 9998; display: grid; place-items: center;
        background: rgba(19,35,58,.6); padding: 20px; animation: rj-fade .15s ease-out;
    }
    .rj-dialog {
        background: var(--rj-sheet); border-radius: var(--rj-radius-lg); max-width: 420px; width: 100%;
        padding: 24px; font-family: var(--rj-font);
    }
    .rj-dialog h3 { margin: 0 0 6px; font-family: var(--rj-display); font-size: 1.5rem; font-weight: 600; color: var(--rj-ink); }
    .rj-dialog p { margin: 0 0 22px; font-size: .95rem; line-height: 1.55; color: var(--rj-muted); }
    .rj-dialog-actions { display: flex; gap: 8px; justify-content: flex-end; }
    .rj-dialog-actions button {
        padding: 8px 16px; border-radius: var(--rj-radius); font-size: .95rem; font-weight: 600;
        cursor: pointer; font-family: inherit; border: 1px solid var(--rj-rule);
        background: var(--rj-sheet); color: var(--rj-ink);
    }
    .rj-dialog-actions .rj-danger-btn { background: var(--rj-danger); border-color: var(--rj-danger); color: #fff; }
    .rj-dialog-actions .rj-primary-btn { background: var(--rj-board); border-color: var(--rj-board); color: #fff; }
    @keyframes rj-fade { from { opacity: 0; } to { opacity: 1; } }
    @media (prefers-reduced-motion: reduce) {
        .rj-toast, .rj-toast.leaving, .rj-overlay { animation: none; }
    }

    /* Empty state */
    .rj-empty {
        padding: 28px 18px; color: var(--rj-muted); text-align: center;
        font-size: .95rem; font-family: var(--rj-font);
        border: 1px dashed var(--rj-rule); border-radius: var(--rj-radius);
    }

    /* Short windows: keep the nav whole, drop the extra status box */
    @media (max-height: 700px) {
        .rj-now { display: none; }
    }

    /* Mobile */
    @media (max-width: 1023px) {
        .rj-hamburger { display: block; }
        .rj-sidebar {
            position: fixed; left: 0; top: 0; bottom: 0; height: 100vh;
            transform: translateX(-100%); transition: transform .22s ease;
        }
        .rj-sidebar.open { transform: none; }
        .rj-backdrop { position: fixed; inset: 0; background: rgba(19,35,58,.5); z-index: 35; }
        .rj-content { padding: 20px 16px 36px; }
        .rj-header { padding: 0 16px; }
        .rj-footer { padding: 16px; }
        .rj-user { display: none; }
    }
    `;

    // Inline icons, so the interface carries no emoji.
    const ICONS = {
        menu: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>',
        close: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
        lock: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>',
        power: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 3v9"/><path d="M6.4 6.4a9 9 0 1 0 11.2 0"/></svg>'
    };

    let stylesInjected = false;
    function injectStyles() {
        if (stylesInjected) return;
        const el = document.createElement("style");
        el.id = "rj-ui-styles";
        el.textContent = STYLES;
        document.head.appendChild(el);
        stylesInjected = true;
    }

    function initials(name) {
        return String(name || "?").trim().split(/\s+/).slice(0, 2)
            .map(w => w[0]).join("").toUpperCase();
    }

    const YEAR = new Date().getFullYear();

    /** "Now live" strip for the sidebar: the round that is in progress, if any. */
    function nowLiveHtml() {
        const rounds = DB.getRounds();
        const i = rounds.findIndex(r => r.status === "in-progress");
        if (i === -1) {
            return `<div class="rj-now"><span class="rj-now-label">No round is live</span></div>`;
        }
        return `<div class="rj-now">
            <span class="rj-now-label"><span class="rj-live-dot"></span>Now live</span>
            <span class="rj-now-round">${UI.escape(rounds[i].name)}</span>
            <span class="rj-now-seq">Round ${i + 1} of ${rounds.length}</span>
        </div>`;
    }

    window.UI = {

        ICONS: ICONS,

        /** Escape untrusted text before putting it in an HTML string. */
        escape(value) {
            return String(value == null ? "" : value).replace(/[&<>"']/g, c => ({
                "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
            })[c]);
        },

        /**
         * Dashboard chrome for the team, judge and admin pages.
         *
         * The page supplies a #rjShell element for the chrome and a #rjSections
         * wrapper holding sections whose ids match Permissions.navFor(role).
         *
         * opts.onSelect(id)   called on nav clicks so the page can swap sections.
         * opts.isEnabled(item) may veto an item, used to gate a judge's Scoring
         *                     and Schedule behind venue check-in.
         */
        mountShell(opts) {
            injectStyles();
            const session = DB.getSession();
            if (!session) return null;

            const role = session.role;
            const items = Permissions.navFor(role);
            const active = opts.active || (items[0] && items[0].id);
            const esc = this.escape;

            const shell = document.getElementById("rjShell");
            if (!shell) {
                console.error("UI.mountShell: no #rjShell element on the page");
                return null;
            }

            shell.className = "rj-shell";
            shell.innerHTML = `
                <aside class="rj-sidebar" id="rjSidebar">
                    <div class="rj-sidebar-brand">
                        <a class="rj-wordmark" href="index.html">RoboJudge</a>
                        <span class="rj-role">${esc(Permissions.labelFor(role))} console</span>
                    </div>
                    <nav class="rj-nav" id="rjNav" aria-label="Sections"></nav>
                    ${nowLiveHtml()}
                    <div class="rj-sidebar-foot">
                        <button class="rj-logout" id="rjLogout">${ICONS.power} Sign out</button>
                    </div>
                </aside>

                <div class="rj-main">
                    <header class="rj-header">
                        <button class="rj-hamburger" id="rjHamburger" aria-label="Open menu">${ICONS.menu}</button>
                        <h1 class="rj-page-title" id="rjPageTitle"></h1>
                        <div class="rj-header-right">
                            <span class="rj-user">Signed in as <strong>${esc(session.name)}</strong></span>
                            <span class="rj-avatar" title="${esc(session.name)}">${esc(initials(session.name))}</span>
                        </div>
                    </header>
                    <div class="rj-content" id="rjContent"></div>
                    <footer class="rj-footer">
                        <span>RoboJudge &copy; ${YEAR}</span>
                        <a href="index.html">Home</a>
                    </footer>
                </div>
            `;

            // Move the page's own sections into the content area.
            const content = document.getElementById("rjContent");
            const staged = document.getElementById("rjSections");
            if (staged) {
                while (staged.firstChild) content.appendChild(staged.firstChild);
                staged.remove();
            }

            const api = {
                items: items,
                active: active,

                setActive(id) {
                    api.active = id;
                    document.querySelectorAll(".rj-nav-item").forEach(b => {
                        b.classList.toggle("active", b.dataset.navId === id);
                    });
                    const item = items.find(i => i.id === id);
                    const title = document.getElementById("rjPageTitle");
                    if (title && item) title.textContent = item.label;
                    api.closeMobile();
                },

                /** Rebuild the nav. Call after the check-in state changes. */
                refresh() {
                    const nav = document.getElementById("rjNav");
                    nav.innerHTML = "";
                    items.forEach(item => {
                        const enabled = opts.isEnabled ? opts.isEnabled(item) !== false : true;
                        const btn = document.createElement("button");
                        btn.className = "rj-nav-item" + (item.id === api.active ? " active" : "");
                        btn.dataset.navId = item.id;
                        btn.disabled = !enabled;
                        btn.innerHTML = `<span>${esc(item.label)}</span>` +
                            (enabled ? "" : `<span class="rj-nav-lock" title="Check in first">${ICONS.lock}</span>`);
                        btn.addEventListener("click", () => {
                            if (btn.disabled) return;
                            api.setActive(item.id);
                            if (opts.onSelect) opts.onSelect(item.id);
                        });
                        nav.appendChild(btn);
                    });
                },

                openMobile() {
                    document.getElementById("rjSidebar").classList.add("open");
                    if (!document.getElementById("rjBackdrop")) {
                        const b = document.createElement("div");
                        b.className = "rj-backdrop";
                        b.id = "rjBackdrop";
                        b.addEventListener("click", api.closeMobile);
                        document.body.appendChild(b);
                    }
                },

                closeMobile() {
                    const sb = document.getElementById("rjSidebar");
                    if (sb) sb.classList.remove("open");
                    const b = document.getElementById("rjBackdrop");
                    if (b) b.remove();
                }
            };

            api.refresh();
            api.setActive(active);

            document.getElementById("rjHamburger").addEventListener("click", api.openMobile);
            document.getElementById("rjLogout").addEventListener("click", async () => {
                if (await UI.confirm("Sign out of RoboJudge?", { title: "Sign out", confirmText: "Sign out" })) {
                    DB.logout();
                    window.location.href = "login.html";
                }
            });

            return api;
        },

        /** Top navbar for the public pages. Adapts if the visitor is signed in. */
        mountPublicNav(mountId) {
            injectStyles();
            const el = document.getElementById(mountId);
            if (!el) return;
            const session = DB.getSession();
            const right = session
                ? `<a class="rj-btn rj-btn-solid" href="${Permissions.homeFor(session.role)}">Open my dashboard</a>`
                : `<a class="rj-btn rj-btn-ghost" href="register.html">Register</a>
                   <a class="rj-btn rj-btn-solid" href="login.html">Sign in</a>`;
            el.className = "rj-public-nav";
            el.innerHTML = `<div class="rj-public-inner">
                <a class="rj-wordmark" href="index.html">RoboJudge</a>${right}
            </div>`;
        },

        mountFooter(mountId) {
            injectStyles();
            const el = document.getElementById(mountId);
            if (!el) return;
            el.className = "rj-footer";
            el.innerHTML = `<span>RoboJudge &copy; ${YEAR}, Full Stack Development lab project</span>
                <a href="index.html">Home</a> <a href="register.html">Register</a>`;
        },

        /** Transient notification. Replaces alert(). */
        toast(message, type) {
            injectStyles();
            type = type || "info";
            let box = document.getElementById("rjToasts");
            if (!box) {
                box = document.createElement("div");
                box.className = "rj-toasts";
                box.id = "rjToasts";
                document.body.appendChild(box);
            }

            const el = document.createElement("div");
            el.className = "rj-toast " + type;
            el.setAttribute("role", type === "error" ? "alert" : "status");
            el.innerHTML = `<span class="rj-toast-msg">${this.escape(message)}</span>` +
                `<button class="rj-toast-close" aria-label="Dismiss">${ICONS.close}</button>`;

            const dismiss = () => {
                el.classList.add("leaving");
                setTimeout(() => el.remove(), 200);
            };
            el.querySelector(".rj-toast-close").addEventListener("click", dismiss);
            box.appendChild(el);
            setTimeout(dismiss, type === "error" ? 6000 : 3800);
            return el;
        },

        /** Modal confirmation. Replaces confirm(). Resolves to true or false. */
        confirm(message, options) {
            injectStyles();
            const o = options || {};
            return new Promise(resolve => {
                const overlay = document.createElement("div");
                overlay.className = "rj-overlay";
                overlay.innerHTML = `
                    <div class="rj-dialog" role="dialog" aria-modal="true">
                        <h3>${this.escape(o.title || "Are you sure?")}</h3>
                        <p>${this.escape(message)}</p>
                        <div class="rj-dialog-actions">
                            <button data-act="cancel">${this.escape(o.cancelText || "Cancel")}</button>
                            <button data-act="ok" class="${o.danger === false ? "rj-primary-btn" : "rj-danger-btn"}">
                                ${this.escape(o.confirmText || "Confirm")}
                            </button>
                        </div>
                    </div>`;

                const close = result => {
                    document.removeEventListener("keydown", onKey);
                    overlay.remove();
                    resolve(result);
                };
                const onKey = e => {
                    if (e.key === "Escape") close(false);
                    if (e.key === "Enter") close(true);
                };

                overlay.addEventListener("click", e => {
                    const act = e.target.closest("[data-act]");
                    if (act) close(act.getAttribute("data-act") === "ok");
                    else if (e.target === overlay) close(false);
                });
                document.addEventListener("keydown", onKey);

                document.body.appendChild(overlay);
                const ok = overlay.querySelector('[data-act="ok"]');
                if (ok) ok.focus();
            });
        },

        /** Consistent empty-state markup. */
        empty(message) {
            return `<div class="rj-empty">${this.escape(message)}</div>`;
        },

        /** Trigger a client-side file download, used by the CSV export. */
        download(filename, text, mime) {
            const blob = new Blob([text], { type: (mime || "text/plain") + ";charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        }
    };
})();
