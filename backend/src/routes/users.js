const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');

router.get('/search', usersController.searchUsers);
router.get('/:id/items', usersController.getUserItems);
router.get('/:id', usersController.getUser);

module.exports = router;
