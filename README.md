# odin-InnerCircle
# Project Context — Members Only
### Node.js MVC | Express | PostgreSQL | Passport.js | bcryptjs | EJS | Plain CSS

---

## 1. Concept

A private message board where users can sign up and log in.
- **Guests** — can see messages but not who wrote them (author hidden)
- **Members (logged in)** — can see the author and timestamp of every message
- **Admins** — can edit or delete any message regardless of ownership

The "members only" twist is about what you can *see*, not what you can *post*.
Anyone logged in is a member. Admin is a separate flag on the user.

---

## 2. Tech Stack

| Concern        | Choice                              |
|----------------|--------------------------------------|
| Runtime        | Node.js                              |
| Framework      | Express                              |
| Templating     | EJS (partials pattern)               |
| Styling        | Plain CSS (clean & minimal)          |
| Database       | PostgreSQL via `pg`                  |
| Validation     | express-validator                    |
| Auth           | Passport.js (LocalStrategy)          |
| Password hash  | bcryptjs                             |
| Sessions       | express-session + connect-pg-simple  |
| Architecture   | MVC                                  |
| Deployment     | Render (app) + Neon (DB)             |

---

## 3. UI Vibe

- **Clean & minimal** — no dark theme, no heavy decoration
- Light background, good typography, simple card layout
- CSS variables for spacing, radius, and a single accent colour
- Font: decide before styling — ask Claude for suggestion when ready
- No rarity badges, no fantasy imagery — plain and readable

---

## 4. Database Schema

### Table: `users`
| Column     | Type         | Constraints                       |
|------------|--------------|-----------------------------------|
| id         | INTEGER      | PK, GENERATED ALWAYS AS IDENTITY  |
| username   | VARCHAR(50)  | NOT NULL, UNIQUE                  |
| password   | VARCHAR(255) | NOT NULL (stores bcrypt hash)     |
| is_admin   | BOOLEAN      | NOT NULL, DEFAULT FALSE           |

> `is_admin` is the proper way to handle roles — no hardcoding, no .env comparison.
> To make someone admin: `UPDATE users SET is_admin = TRUE WHERE username = 'you';`

### Table: `messages`
| Column     | Type         | Constraints                        |
|------------|--------------|------------------------------------|
| id         | INTEGER      | PK, GENERATED ALWAYS AS IDENTITY   |
| title      | VARCHAR(100) | NOT NULL                           |
| content    | VARCHAR(500) | NOT NULL                           |
| created_at | TIMESTAMP    | DEFAULT NOW()                      |
| user_id    | INTEGER      | FK → users(id) ON DELETE CASCADE   |

> `ON DELETE CASCADE` — if a user is deleted, their messages go with them.

### Table: `session` (managed by connect-pg-simple)
> Created automatically — do NOT define this manually. connect-pg-simple handles it.

---

## 5. Routes Plan

### Auth
| Method | Path         | Action                          |
|--------|--------------|---------------------------------|
| GET    | /sign-up     | Show sign-up form               |
| POST   | /sign-up     | Create user (hashed password)   |
| GET    | /log-in      | Show log-in form                |
| POST   | /log-in      | Passport authenticate           |
| GET    | /log-out     | Destroy session, redirect home  |

### Core
| Method | Path       | Action                                    |
|--------|------------|-------------------------------------------|
| GET    | /          | Landing page                              |
| GET    | /messages  | Message board (author hidden if guest)    |

### Messages — Create
| Method | Path              | Action                                  |
|--------|-------------------|-----------------------------------------|
| GET    | /messages/new     | Show new message form (logged in only)  |
| POST   | /messages         | Create new message                      |

### Messages — Read
| Method | Path              | Action              |
|--------|-------------------|---------------------|
| GET    | /messages/:id     | View single message |

### Messages — Edit
| Method | Path                   | Action                                        |
|--------|------------------------|-----------------------------------------------|
| GET    | /messages/:id/edit     | Show edit form (owner or admin only)          |
| POST   | /messages/:id/edit     | Update message (owner or admin only)          |

### Messages — Delete
| Method | Path                      | Action                           |
|--------|---------------------------|----------------------------------|
| POST   | /messages/:id/delete      | Delete message (owner or admin)  |

---

## 6. Folder Structure

```
app.js
routes/
  indexRouter.js        ← GET / (landing page)
  authRouter.js         ← sign-up, log-in, log-out
  messageRouter.js      ← all /messages/* routes
controllers/
  indexController.js
  authController.js
  messageController.js
db/
  pool.js
  queries.js
  populatedb.js
views/
  index.ejs             ← landing page
  sign-up.ejs
  log-in.ejs
  messages/
    index.ejs           ← message board (list all)
    show.ejs            ← single message view
    new.ejs             ← new message form
    edit.ejs            ← edit message form
  partials/
    header.ejs
    navbar.ejs
    footer.ejs
    error.ejs
public/
  styles.css
```

---

## 7. Authentication — Full Implementation Plan

> ⚠️ This is the new skill. Read this section fully before writing any auth code.
> Understand the concept first, then implement step by step.

### How it all fits together (the mental model)

```
User submits login form
        ↓
POST /log-in → passport.authenticate("local")
        ↓
LocalStrategy runs → queries DB → bcrypt.compare()
        ↓
If OK → passport.serializeUser() → stores user.id in session
        ↓
Session saved to PostgreSQL (connect-pg-simple)
        ↓
Cookie (connect.sid) sent to browser
        ↓
On every future request → express-session reads cookie
        ↓
passport.deserializeUser() → fetches full user from DB by id
        ↓
req.user is now available in all routes and views
```

### Install
```bash
npm install passport passport-local express-session connect-pg-simple bcryptjs
```

### Middleware order in app.js (ORDER MATTERS — do not rearrange)

```js
const session = require("express-session");
const pgSession = require("connect-pg-simple")(session);
const passport = require("passport");
const pool = require("./db/pool");

// 1. Session middleware — must come before passport
app.use(session({
    store: new pgSession({
        pool: pool,
        createTableIfMissing: true   // auto-creates the session table in your DB
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 }  // 30 days
}));

// 2. Passport — must come after session
app.use(passport.session());

// 3. Body parser — so req.body is available
app.use(express.urlencoded({ extended: false }));

// 4. Make currentUser available in ALL views automatically
app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    next();
});
```

### The three Passport functions (define these before your routes)

```js
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");

// 1. Strategy — runs when POST /log-in is hit
passport.use(
    new LocalStrategy(async (username, password, done) => {
        try {
            const { rows } = await pool.query(
                "SELECT * FROM users WHERE username = $1", [username]
            );
            const user = rows[0];
            if (!user) return done(null, false, { message: "Incorrect username" });
            const match = await bcrypt.compare(password, user.password);
            if (!match) return done(null, false, { message: "Incorrect password" });
            return done(null, user);
        } catch(err) {
            return done(err);
        }
    })
);

// 2. Serialize — what to store in the session (just the id)
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// 3. Deserialize — how to get the full user back from the session id
passport.deserializeUser(async (id, done) => {
    try {
        const { rows } = await pool.query(
            "SELECT * FROM users WHERE id = $1", [id]
        );
        done(null, rows[0]);
    } catch(err) {
        done(err);
    }
});
```

### Sign-up controller (hash password before storing)

```js
const bcrypt = require("bcryptjs");

async function signUp(req, res, next) {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        await pool.query(
            "INSERT INTO users (username, password) VALUES ($1, $2)",
            [req.body.username, hashedPassword]
        );
        res.redirect("/log-in");
    } catch(err) {
        next(err);
    }
}
```

### Log-in route (Passport does the work)

```js
router.post(
    "/log-in",
    passport.authenticate("local", {
        successRedirect: "/messages",
        failureRedirect: "/log-in"
    })
);
```

> Passport reads `req.body.username` and `req.body.password` automatically.
> Your form input `name` attributes must be exactly `username` and `password`.

### Log-out route

```js
router.get("/log-out", (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        res.redirect("/");
    });
});
```

---

## 8. Authorization — Protecting Routes

These are middleware functions you write yourself and drop into any route that needs guarding.

```js
// Place these in a middleware file or at the top of the relevant router

function ensureLoggedIn(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect("/log-in");
}

// Used for edit and delete — allows the message's own author OR any admin
function ensureOwnerOrAdmin(req, res, next) {
    if (!req.isAuthenticated()) return res.redirect("/log-in");
    // message must be fetched first and attached to req (e.g. via param middleware)
    // then check ownership or admin flag
    const isOwner = req.message.user_id === req.user.id;
    const isAdmin = req.user.is_admin;
    if (isOwner || isAdmin) return next();
    const err = new Error("Forbidden");
    err.status = 403;
    next(err);
}
```

> Fetch the message and attach it to `req` before `ensureOwnerOrAdmin` runs.
> A clean way to do this is a param middleware on `router.param("id", ...)`.

**Usage in router:**
```js
router.get("/messages/new",         ensureLoggedIn,       messageController.getNewMessageForm);
router.post("/messages",            ensureLoggedIn,       validateMessage, messageController.createMessage);
router.get("/messages/:id",                               messageController.getMessageById);
router.get("/messages/:id/edit",    ensureOwnerOrAdmin,   messageController.getEditMessageForm);
router.post("/messages/:id/edit",   ensureOwnerOrAdmin,   validateMessage, messageController.updateMessage);
router.post("/messages/:id/delete", ensureOwnerOrAdmin,   messageController.deleteMessage);
```

> `req.isAuthenticated()` is a method Passport adds — returns true if the user has a valid session.

---

## 9. View Logic — Showing/Hiding Based on Auth

Since `res.locals.currentUser = req.user` is set in middleware, you can use
`currentUser` in any EJS view without passing it manually from each controller.

```ejs
<!-- Navbar: show log out or log in depending on state -->
<% if (locals.currentUser) { %>
    <span>Hi, <%= currentUser.username %></span>
    <a href="/log-out">Log out</a>
<% } else { %>
    <a href="/log-in">Log in</a>
    <a href="/sign-up">Sign up</a>
<% } %>
```

```ejs
<!-- Message list: hide author from guests -->
<% messages.forEach(msg => { %>
    <div class="message-card">
        <h3><%= msg.title %></h3>
        <p><%= msg.content %></p>
        <% if (locals.currentUser) { %>
            <small>Posted by <%= msg.username %> on <%= msg.created_at %></small>
        <% } %>
        <%
          const canAct = locals.currentUser &&
                         (currentUser.id === msg.user_id || currentUser.is_admin);
        %>
        <% if (canAct) { %>
            <a href="/messages/<%= msg.id %>/edit">Edit</a>
            <form action="/messages/<%= msg.id %>/delete" method="POST">
                <button type="submit">Delete</button>
            </form>
        <% } %>
    </div>
<% }) %>
```

> The same `canAct` check applies on `show.ejs` — owner or admin sees Edit and Delete.

---

## 10. DB Queries Needed

```js
// users
insertUser(username, hashedPassword)              // sign-up
getUserByUsername(username)                       // LocalStrategy login lookup

// messages
getAllMessages()                                  // JOIN with users — message board
getMessageById(id)                               // single message view + edit form
insertMessage(title, content, userId)            // create
updateMessage(id, title, content)                // edit
deleteMessage(id)                                // owner or admin delete
```

**getAllMessages query** — JOIN so we can show the author's username:
```sql
SELECT messages.*, users.username
FROM messages
JOIN users ON messages.user_id = users.id
ORDER BY messages.created_at DESC;
```

**getMessageById query:**
```sql
SELECT messages.*, users.username
FROM messages
JOIN users ON messages.user_id = users.id
WHERE messages.id = $1;
```

---

## 11. Environment Variables

**.env:**
```
DATABASE_URL=postgresql://user:password@localhost:5432/members_only
NODE_ENV=development
SESSION_SECRET=some_long_random_string
```

**.env.example:**
```
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
NODE_ENV=development
SESSION_SECRET=your_session_secret_here
```

> `SESSION_SECRET` is used by express-session to sign the session cookie.
> In production, make it long and random. Never commit the real value.

---

## 12. Making Yourself Admin

After signing up through the app, run this directly in psql or Neon:

```sql
UPDATE users SET is_admin = TRUE WHERE username = 'your_username';
```

No special route needed. This is intentional — admin is a DB-level privilege.

---

## 13. Validation Notes

Sign-up form needs:
- `username` — not empty, reasonable length, check it doesn't already exist (`.custom()`)
- `password` — minimum length (e.g. 6 chars)
- `confirmPassword` — must match `password` (`.custom()` cross-field check)

Message form needs (used for both create and edit):
- `title` — not empty, max length
- `content` — not empty, max length

---

## 14. Build Order

Follow this — don't skip ahead:

1. Project init — `npm init`, install all deps, `app.js` scaffold, `.env`, `.gitignore`
2. DB schema — write `populatedb.js`, create `users` and `messages` tables, verify in psql
3. Session setup — configure `express-session` + `connect-pg-simple` in app.js, verify `session` table appears in DB
4. Passport setup — define `LocalStrategy`, `serializeUser`, `deserializeUser` in app.js
5. Sign-up — route + controller + view + bcrypt hash on POST
6. Log-in / Log-out — route + passport.authenticate + logout
7. Landing page — static GET / with links to log-in and sign-up
8. Message board — GET /messages, fetch all messages, render with conditional author display
9. New message form — GET + POST /messages, protected by `ensureLoggedIn`
10. Single message view — GET /messages/:id
11. Edit message — GET + POST /messages/:id/edit, protected by `ensureOwnerOrAdmin`
12. Delete message — POST /messages/:id/delete, protected by `ensureOwnerOrAdmin`
13. Validation — add express-validator to sign-up and message forms
14. Styling — clean minimal CSS
15. Deploy — Neon DB, Render, seed if needed, set all env vars

---

## 15. New Concepts This Project Introduces

| Concept                        | Notes                                                              |
|--------------------------------|--------------------------------------------------------------------|
| Passport.js LocalStrategy      | Username/password auth strategy                                    |
| express-session                | Server-side session management                                     |
| connect-pg-simple              | Persist sessions in PostgreSQL instead of memory                   |
| bcryptjs                       | Hash passwords on sign-up, compare on login                        |
| serialize / deserialize        | How Passport stores and retrieves user across requests             |
| req.user                       | Populated by Passport after deserialization                        |
| req.isAuthenticated()          | Passport method — use this in auth guard middleware                |
| res.locals                     | Express way to share data across all views without passing manually|
| is_admin boolean column        | Proper role flag — no hardcoding, no env var comparison            |
| Authorization middleware       | `ensureLoggedIn` / `ensureOwnerOrAdmin` — reusable route guards   |
| Ownership check                | Compare `req.user.id === msg.user_id` to gate edit/delete          |
| JOIN for messages + users      | Fetch message author's username in one query                       |
| router.param()                 | Middleware to fetch a resource by id before route handlers run     |

---

## 16. Dependencies to Install

```bash
npm install express ejs pg dotenv express-validator passport passport-local express-session connect-pg-simple bcryptjs
```

**package.json scripts:**
```json
"scripts": {
  "start": "node app.js",
  "dev": "node --watch app.js",
  "populate": "node db/populatedb.js"
}
```

---

*Context file prepared before project start — The Odin Project Node.js curriculum*
