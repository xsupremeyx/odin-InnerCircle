const { Router } = require('express');
const router = Router();
const messageController = require('../controllers/messageController');
const { ensureLoggedIn, ensureOwnerOrAdmin } = require('../middleware/auth');
const db = require('../db/queries');

router.param("id", async (req, res, next, id) => {
    try{
        const parsedId = parseInt(id, 10);
        if(isNaN(parsedId)){
            const err = new Error('Invalid message ID');
            err.status = 404;
            return next(err);
        }

        const message = await db.getMessageById(parsedId);
        if(!message){
            const err = new Error('Message not found');
            err.status = 404;
            return next(err);
        }
        req.message = message;
        next();
    }
    catch(err){
        next(err);
    }
})

router.get('/new', ensureLoggedIn, messageController.getNewMessageForm);
router.post('/new', ensureLoggedIn, messageController.createMessage);

router.get('/:id/edit', ensureOwnerOrAdmin, messageController.getEditMessageForm);
router.post('/:id/edit', ensureOwnerOrAdmin, messageController.updateMessage);
router.get('/:id', messageController.getMessageById);
router.get('/', messageController.getMessages);

module.exports = router;