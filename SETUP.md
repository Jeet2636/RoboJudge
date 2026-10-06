# Setting up RoboJudge on a new machine

These steps are for Windows. Run commands in **PowerShell**, unless a step says to use an admin window.

## 1. Install the software

You need Node.js (version 18 or newer), Git, MySQL Server 8 and MongoDB Community Server.

The quickest way is `winget`, in a PowerShell window opened with **Run as administrator**:

```powershell
winget install --id OpenJS.NodeJS.LTS -e
winget install --id Git.Git -e
winget install --id MongoDB.Server -e
```

Close and reopen PowerShell afterwards so `node`, `npm` and `git` are found.

**MongoDB** installs as a Windows service called `MongoDB` and starts on its own.

**MySQL** needs a root password and a service. Pick one of these options.

### Option A: MySQL Installer (easiest)

1. Download **MySQL Installer for Windows** from <https://dev.mysql.com/downloads/installer/>.
2. Choose **Server only**, or **Developer Default** if you also want MySQL Workbench.
3. When asked, set a **root password** and write it down. You will put it in `.env` in step 3.
4. Keep **Configure MySQL Server as a Windows Service** ticked, with **Start at system startup**.

### Option B: winget, then set up the service by hand

```powershell
winget install --id Oracle.MySQL -e
```

This only copies the program files. In an **admin** PowerShell window, create the data folder, register the service and set the root password. Replace `YOUR_PASSWORD` with your own:

```powershell
$bin  = "C:\Program Files\MySQL\MySQL Server 8.4\bin"
$base = "C:\ProgramData\MySQL\MySQL Server 8.4"
New-Item -ItemType Directory -Force $base | Out-Null
@"
[mysqld]
basedir=C:/Program Files/MySQL/MySQL Server 8.4
datadir=C:/ProgramData/MySQL/MySQL Server 8.4/Data
port=3306
bind-address=127.0.0.1
"@ | Set-Content -Encoding ascii "$base\my.ini"

& "$bin\mysqld.exe" --defaults-file="$base\my.ini" --initialize-insecure --console
& "$bin\mysqld.exe" --install MySQL84 --defaults-file="$base\my.ini"
Start-Service MySQL84
& "$bin\mysql.exe" -u root --skip-password -e "ALTER USER 'root'@'localhost' IDENTIFIED BY 'YOUR_PASSWORD';"
```

If winget installed a version other than 8.4, change `8.4` in the paths to match the folder under `C:\Program Files\MySQL`.

### Check everything is in place

```powershell
node -v                              # v18 or newer
git --version
Get-Service MongoDB, MySQL*          # both should say Running
```

## 2. Get the code

```powershell
git clone https://github.com/Jeet2636/RoboJudge.git
cd RoboJudge
npm install
```

`npm install` downloads the server's packages into `node_modules`. That folder is not stored in the repository.

## 3. Create the `.env` file

`.env` holds this machine's passwords, so it is not in the repository. Copy the template:

```powershell
Copy-Item .env.example .env
notepad .env
```

Then set these values:

| Setting | What to put |
|---|---|
| `MYSQL_PASSWORD` | The MySQL root password you chose in step 1 |
| `JWT_SECRET` | Any long random text. It signs sign-in tokens, so don't reuse a real password |
| `MYSQL_HOST`, `MYSQL_USER`, `MYSQL_DATABASE` | Leave as they are unless MySQL runs on another computer or under another user |
| `MONGO_URL`, `MONGO_DB` | Leave as they are unless MongoDB runs on another computer |
| `PORT` | `3000`, or another free port |

To make a random `JWT_SECRET`:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 4. Create the databases and demo data

```powershell
npm run db:init
```

You should see:

```
MySQL  "robojudge": 2 teams, 6 users, 1 participants
MongoDB "robojudge": 3 scores, 1 log
Seed complete.
```

You can run this again at any time to reset everything to the demo data.

## 5. Start the app

```powershell
npm start
```

Open <http://localhost:3000> and sign in with a demo account from the [README](README.md#demo-accounts). Press `Ctrl+C` in the terminal to stop the server.

## 6. Optional: run the practical scripts

```powershell
npm run p8:part1     # MySQL: create, insert, update
npm run p8:part2     # MySQL: delete, select, distinct, drop table
npm run db:init      # brings back the table that p8:part2 dropped
npm run p10          # MongoDB: insert, find, update, delete
node src/index.js    # Practical 2: JSON data
```

## Things that work differently on a new machine

- **Browser data starts fresh.** Most dashboard data (teams the admin adds, rounds, judges' drafts) lives in each browser's own storage. A new device or browser starts from the demo data. Only the server console data is in MySQL and MongoDB.
- **Judge check-in needs `localhost` or HTTPS.** Browsers only share your location with secure pages. On the machine running the server, use `http://localhost:3000`. If you open it from another device using an address like `http://192.168.x.x:3000`, check-in will fail.
- **The venue is set to Ahmedabad.** If you are somewhere else, sign in as admin, go to **Settings**, click **Use my current location**, then **Save venue**. Otherwise every judge will be out of range.
- **Some pages need internet.** Tailwind, Vue, the map, the fonts, and Bootstrap on the sign-in page load from online CDNs. The admin and registration pages use the bundled Bootstrap and work offline.
- **Opening it from other devices on your network** needs Node.js allowed through Windows Firewall on your `PORT`.

## Troubleshooting

| Problem | Fix |
|---|---|
| `npm start` says `Could not read package.json` | You are in the wrong folder. `cd` into the `RoboJudge` folder first. If the path has spaces, put it in quotes |
| Pages show "Database unavailable" | MySQL or MongoDB isn't running, or `npm run db:init` hasn't been run. Check with `Get-Service MongoDB, MySQL*`, start a stopped one with `Start-Service <name>`, then run `npm run db:init` |
| `db:init` fails with `Access denied for user 'root'` | `MYSQL_PASSWORD` in `.env` doesn't match the MySQL root password |
| `db:init` fails with `ECONNREFUSED ...:3306` | The MySQL service isn't running |
| `db:init` hangs, then fails on MongoDB | The MongoDB service isn't running: `Start-Service MongoDB` |
| `EADDRINUSE: address already in use :::3000` | Something else is using port 3000. Stop it, or set a different `PORT` in `.env` |
| Server console sign-in says "Invalid username or password" with a demo account | Run `npm run db:init` to recreate the demo users |
| Judge check-in says you're too far away | Set the venue to your location (see above), then click **Try check-in again** |
