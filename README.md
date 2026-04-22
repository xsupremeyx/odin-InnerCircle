# Inner Circle

A members-only message board built with Node.js, Express, and PostgreSQL. Access is gated — you have to know the passcode to get in.

**Live Demo → [inner-circle-5lej.onrender.com](https://inner-circle-5lej.onrender.com/)**

---

## What it does

- Sign up and log in with a username and password
- Join the inner circle with a passcode to unlock author visibility and posting
- Post, edit, and delete messages on The Board
- Guests see messages but authors are hidden — everyone is anonymous until you're in
- Admins can edit and delete any message regardless of ownership
- Light and dark mode with system preference detection and manual toggle

---

## Tech stack

| Layer | Tech |
|---|---|
| Runtime | Node.js |
| Framework | Express |
| Templating | EJS |
| Database | PostgreSQL (Supabase) |
| Auth | Passport.js (LocalStrategy) |
| Sessions | express-session + connect-pg-simple |
| Flash messages | connect-flash |
| Validation | express-validator |
| Password hashing | bcryptjs |
| Hosting | Render |

---

## Project structure

```
├── app.js
├── controllers/
│   ├── authController.js
│   ├── indexController.js
│   └── messageController.js
├── db/
│   ├── pool.js
│   ├── queries.js
│   └── populatedb.js
├── middleware/
│   ├── auth.js
│   └── validate.js
├── routes/
│   ├── authRouter.js
│   ├── indexRouter.js
│   └── messageRouter.js
├── views/
│   ├── partials/
│   │   ├── header.ejs
│   │   ├── footer.ejs
│   │   ├── navbar.ejs
│   │   └── error.ejs
│   ├── messages/
│   │   ├── index.ejs
│   │   ├── show.ejs
│   │   ├── new.ejs
│   │   └── edit.ejs
│   ├── index.ejs
│   ├── log-in.ejs
│   ├── sign-up.ejs
│   ├── join.ejs
│   └── error.ejs
└── public/
    ├── styles.css
    ├── css/
    │   ├── base.css
    │   ├── layout.css
    │   ├── cards.css
    │   ├── forms.css
    │   ├── utilities.css
    │   └── animations.css
    ├── js/
    │   ├── theme.js
    │   └── nav.js
    └── imgs/
        ├── hero-light.webp
        ├── hero-dark.webp
        ├── favicon-32x32.png
        ├── favicon-180x180.png
        └── favicon-192x192.png
```

---

## Running locally

**1. Clone the repo**
```bash
git clone https://github.com/yourusername/inner-circle.git
cd inner-circle
```

**2. Install dependencies**
```bash
npm install
```

**3. Set up environment variables**

Copy `.env.example` to `.env` and fill in your values:
```bash
cp .env.example .env
```

```
DATABASE_URL=your_postgres_connection_string
NODE_ENV=development
SESSION_SECRET=your_session_secret
MEMBERSHIP_PASS=your_membership_passcode
POPULATEPASS=password_for_seeded_users
```

**4. Set up the database**

Create the tables:
```sql
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    is_member BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS messages (
    id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    title VARCHAR(100) NOT NULL,
    content VARCHAR(500) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    user_id INT NOT NULL,
    CONSTRAINT fk_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

Optionally seed sample data (drops and recreates tables):
```bash
node db/populatedb.js
```

**5. Start the server**
```bash
npm start
```

Visit `http://localhost:3000`

---

## Features

- **Membership gating** — passcode required to reveal authors and post messages
- **Admin role** — can edit and delete any message regardless of ownership
- **Light / dark mode** — manual toggle with system preference fallback, persisted via localStorage
- **Mobile responsive** — hamburger nav, stacked hero layout, fluid cards
- **Clickable cards** — full card is a link, with Edit/Delete actions correctly layered above
- **Flash messages** — login failure feedback via connect-flash
- **IST timestamps** — message dates displayed in Indian Standard Time
- **Animations** — page fade-in, hero slide-in, card hover lift, button press feedback, mobile menu slide-down
- **Favicons** — 32px, 180px (Apple), 192px (Android)

---

## Deployment

Deployed on **Render** with **Supabase** as the managed PostgreSQL database.

Environment variables set in the Render dashboard. SSL handled automatically via the `NODE_ENV=production` check in `db/pool.js`. Sessions persisted server-side using `connect-pg-simple` with an auto-created session table.

---

## License

MIT
