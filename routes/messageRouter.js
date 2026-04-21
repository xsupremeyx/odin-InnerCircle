const { Router } = require('express');
const router = Router();
const messageController = require('../controllers/messageController');
const { ensureLoggedIn } = require('../middleware/auth');


router.get('/new', ensureLoggedIn, messageController.getNewMessageForm);
router.post('/new', ensureLoggedIn, messageController.createMessage);
router.get('/', messageController.getMessages);

module.exports = router;