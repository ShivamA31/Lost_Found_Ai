const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const messagesController = require('../controllers/messagesController');

router.use(authMiddleware);
router.get('/conversations', messagesController.getConversations);
router.get('/:userId', messagesController.getThread);
router.post('/', messagesController.sendMessage);

module.exports = router;
