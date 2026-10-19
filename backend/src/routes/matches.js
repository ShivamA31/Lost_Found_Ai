const express = require('express');
const router = express.Router();
const matchesController = require('../controllers/matchesController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/item/:itemId', matchesController.getItemMatches);
router.post('/generate/:itemId', matchesController.generateMatches);
router.put('/:id/confirm', matchesController.confirmMatch);
router.put('/:id/reject', matchesController.rejectMatch);

module.exports = router;
