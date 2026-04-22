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
        title: "Drop a Thought",
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
                    title: "Drop a Thought",
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
        res.render('messages/show', { title: req.message.title, message: req.message });
    }
    catch(err){
        next(err);
    }
}

function getEditMessageForm(req, res, next){
    res.render('messages/edit', {
        title: "Edit Your Drop",
        errors: [],
        data: req.message,
    })
}

const updateMessage = [
    validateMessage,
    async (req, res, next) => {
        try{
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).render('messages/edit', {
                    title: "Edit Your Drop",
                    errors: errors.array(),
                    data: {
                        ...req.body,
                        id: req.message.id,
                    }
                })
            }
            const { title, content } = matchedData(req);
            await db.updateMessage(req.message.id, title, content);
            res.redirect(`/messages/${req.message.id}`);
        }
        catch(err){
            next(err);
        }
    }
]

async function deleteMessage(req, res, next){
    try{
        await db.deleteMessage(req.message.id);
        res.redirect('/messages');
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
    getEditMessageForm,
    updateMessage,
    deleteMessage,
}