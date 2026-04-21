const { body } = require('express-validator');
const pool = require('../db/pool');

const validateMessage = [
    body('title').trim().isLength({min: 1, max: 100}).withMessage('Title is required and must be less than 100 characters.'),
    body('content').trim().isLength({min: 1, max: 500}).withMessage('Content is required and must be less than 500 characters.'),
]

const validateSignUp = [
    body('username')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Username is required and must be less than 50 characters.')
    .custom(async (username) => {
        const { rows } = await pool.query(
            "SELECT 1 FROM users WHERE username = $1",
            [username]
        );
        if (rows.length > 0) {
            throw new Error("Username already taken");
        }
        return true;
    }),
    body('password').isLength({min: 6}).withMessage('Password must be at least 6 characters long.'),
    body('confirmPassword').custom((value, { req }) => {
        if( value !== req.body.password){
            throw new Error('Passwords do not match.');
        }
        return true;
    }),
]

module.exports = {
    validateMessage,
    validateSignUp,
}