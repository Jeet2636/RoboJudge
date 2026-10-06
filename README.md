# RoboJudge

A judging platform for robotics competitions, built for the Full Stack Development lab (3CS524CC26). Admins run the event round by round, judges check in at the venue and score the round that is live, and teams see their averaged results.

To run it on a new machine, follow **[SETUP.md](SETUP.md)**.

## What each role can do

| Role | Can do |
|---|---|
| **Admin** | Manage teams, judges and participants; set the round order (drag and drop) and which round is live; give a judge access to a locked round; see every score, the standings and judge progress; export scores to CSV; set the venue location |
| **Judge** | Check in at the venue (location must be inside the venue radius); score the live round out of 10 per criterion, with drafts saved in the browser; view the round order |
| **Team** | See its own results, averaged across the judging panel. Teams never see which judge gave which score, and never see rankings |

## Practicals covered

| Practical | Where |
|---|---|
| 2: JSON with Node.js | `data/team.json`, `src/utils/fileHandler.js`, `src/models/team.js`, `src/index.js` |
| 3: Responsive design (viewport, image swap, `vw` text, media queries) | `public/index.html`, `public/ui.js` |
| 4: Geolocation, Local Storage, Drag and Drop | `public/judge.js` (check-in, score drafts), `public/db.js`, `public/admin.html` (round order) |
| 5: Bootstrap online and offline, registration form | `public/login.html` (CDN), `public/admin.html` and `public/register.html` (offline, `public/vendor/`) |
| 6: Tailwind CSS | `public/index.html`, `public/judge.html`, `public/team.html` |
| 7: Vue custom directives | `public/judge.html` and `public/judge.js`: `v-uppercase`, `v-status`, `v-date` on the judge's Schedule |
| 8: Node.js with MySQL | `src/db/teamsRepo.js`, `src/practicals/p8-mysql-part1.js`, `src/practicals/p8-mysql-part2.js` |
| 9: Role-based authentication and access control | `public/permissions.js` (shared access matrix), `src/middleware/auth.js`, `src/routes/` |
| 10: Node.js with MongoDB CRUD | `src/db/scoresRepo.js`, `src/practicals/p10-mongo-crud.js` |
| 11: Git and GitHub | this repository |

## How it is built

- **Front end:** plain HTML and JavaScript. Tailwind on the home, judge and team pages; Bootstrap on the admin, login, registration and server console pages. One shared look comes from `public/theme.css` and the dashboard shell in `public/ui.js`.
- **Browser data:** the main dashboards keep their data in the browser's Local Storage (`public/db.js`), seeded with demo data on first load.
- **Server:** Express (`src/server.js`) serves the `public/` folder and a JSON API.
  - MySQL stores users (bcrypt-hashed passwords), teams and participants.
  - MongoDB stores scores and the activity log.
  - Signing in returns a JWT, and every API route checks the caller's role against the same access matrix the pages use.
- **Server console:** `public/server.html` is the page that uses the API. Open it from Admin, then Settings.

## Project layout

```
public/            pages, styles and browser scripts (served by Express)
  vendor/          offline Bootstrap
src/
  server.js        Express app
  middleware/      JWT check and role check
  routes/          /api/auth, /api/teams, /api/scores, /api/logs
  db/              MySQL and MongoDB connections, repositories, seed script
  practicals/      stand-alone scripts for practicals 8 and 10
  models/, utils/  practical 2 (JSON file handling)
data/team.json     practical 2 sample data
.env.example       template for the local .env file
```

## Commands

| Command | What it does |
|---|---|
| `npm start` | Start the app at http://localhost:3000 |
| `npm run db:init` | Create the MySQL database and tables and the MongoDB collections, and load the demo data. Safe to re-run: it wipes and reloads |
| `npm run p8:part1` | Practical 8.I: create database and table, insert, update |
| `npm run p8:part2` | Practical 8.II: delete, select, select distinct, drop table. Run `npm run db:init` afterwards to get the table back |
| `npm run p10` | Practical 10: insert, find, update and delete on MongoDB |
| `node src/index.js` | Practical 2: print the JSON team data |

## Demo accounts

| Role | Username | Password |
|---|---|---|
| Admin | `admin` | `admin123` |
| Judge | `sharma` (also `mehta`, `patel`) | `judge123` |
| Team | `nirma` (also `aquabots`) | `team123` |

These work on the normal sign-in page and on the server console.
