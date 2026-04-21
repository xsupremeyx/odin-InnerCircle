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

module.exports = {
    getMessages,
}