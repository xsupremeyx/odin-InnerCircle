const bcrypt = require('bcryptjs');
const pool = require('../db/pool');
const { validationResult, matchedData } = require('express-validator');

function getSignUp(req, res, next){
    try{
        res.render("sign-up", {
            title: "Sign Up",
            errors: [],
            data: {},
        });
    }
    catch(err){
        next(err);
    }
}

async function postSignUp(req, res, next){
    try{
        const errors = validationResult(req);
        if( !errors.isEmpty()){
            return res.status(400).render("sign-up", {
                title: "Sign Up",
                errors: errors.array(),
                data: req.body,
            });
        }
        // use sanitised data 
        const { username, password } = matchedData(req);
        
        const hashedPassword = await bcrypt.hash(password, 10);

        await pool.query(
            'INSERT INTO users (username, password) VALUES ($1, $2)',
            [username, hashedPassword]
        )
        res.redirect("/log-in");
    }
    catch(err){
        next(err);
    }
}

function getLogIn(req, res, next){
    try{
        res.render("log-in");
    }
    catch(err){
        next(err);
    }
}

function getLogOut(req, res, next){
    req.logout((err) => {
        if (err) return next(err);
        res.redirect("/log-in");
    });
}

module.exports = {
    getSignUp,
    postSignUp,
    getLogIn,
    getLogOut,
}