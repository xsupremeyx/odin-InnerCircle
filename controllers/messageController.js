const db = require('../db/queries');

async function getMessages(req, res, next){
    try{
        const messages = await db.getAllMessages();
        res.render('messages/index', { title: "Inner Circle", messages });
    }
    catch(err){
        next(err);
    }
}

async function getNewMessageForm(req, res, next){
    res.render('messages/new', {
        title: "New Message",
        errors: [],
        data: {}
    })
}

const { validationResult, matchedData } = require('express-validator');

const { validateMessage } = require('../middleware/validate');

const createMessage = [
    validateMessage,
    async (req, res, next) => {
        try{
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).render('messages/new', {
                    title: "New Message",
                    errors: errors.array(),
                    data: req.body, 
                })
            }
            const { title, content } = matchedData(req);
            await db.insertMessage(title, content, req.user.id);
            res.redirect('/messages');
        }
        catch (err) {
            next(err);
        }
    }
]

async function getMessageById(req, res, next){
    try{
        const id = parseInt(req.params.id,10);
        
        if(isNaN(id)){
            const err = new Error('Invalid message ID');
            err.status = 404;
            return next(err);
        }

        const message = await db.getMessageById(id);
        if(!message){
            const err = new Error('Message not found');
            err.status = 404;
            return next(err);
        }
        res.render('messages/show', { title: message.title, message: message });
    }
    catch(err){
        next(err);
    }
}

module.exports = {
    getMessages,
    getNewMessageForm,
    createMessage,
    getMessageById,
}