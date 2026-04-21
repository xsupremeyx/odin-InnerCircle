const { Router } = require('express');
const router = Router();
const messageController = require('../controllers/messageController');

router.get('/messages', messageController.getMessages);

module.exports = router;