const { body } = require('express-validator');

const validateMessage = [
    body('title').trim().isLength({min: 1, max: 100}).withMessage('Title is required and must be less than 100 characters.'),
    body('content').trim().isLength({min: 1, max: 500}).withMessage('Content is required and must be less than 500 characters.'),
]

module.exports = {
    validateMessage,
}