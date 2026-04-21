const express = require('express');
const app = express();
const path = require('node:path');
require('dotenv').config();

// session and passport imports
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');

// database pool import
const pool = require('./db/pool');

// routers import
const authRouter = require('./routes/authRouter');
const messageRouter = require('./routes/messageRouter');
const indexRouter = require('./routes/indexRouter');


app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));

// passport config
passport.use(
    new LocalStrategy(async (username, password, done) => {
        try {
            const { rows } = await pool.query(
                'SELECT * FROM users WHERE username = $1',
                [username]
            );
            const user = rows[0];
            if (!user) return done(null, false, { message: 'Incorrect username.' });
            const match = await bcrypt.compare(password, user.password);
            if (!match) return done(null, false, { message: 'Incorrect password.' });
            return done(null, user);
        }
        catch (err) {
            return done(err);
        }
    })
)

passport.serializeUser((user,done) => {
    done(null, user.id);
})

passport.deserializeUser( async (id, done) => {
    try {
        const { rows } = await pool.query(
            'SELECT * FROM users WHERE id = $1',
            [id]
        );
        done(null, rows[0]);
    }
    catch (err) {
        done(err);
    }
})


// Session middleware (before passport)
app.use(session({
    store: new pgSession({
        pool: pool,
        tableName: 'session',
        createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 30*24*60*60*1000, // 30 days
    }
}));

// Passport middleware
app.use(passport.session());

app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    // Make user info available in all views
    res.locals.currentUser = req.user;
    next();
})

app.use('/', indexRouter);
app.use('/', messageRouter);
app.use('/', authRouter);


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});