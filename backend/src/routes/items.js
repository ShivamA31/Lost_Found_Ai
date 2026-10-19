const express = require('express');
const router = express.Router();
const itemsController = require('../controllers/itemsController');
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', itemsController.getItems);
router.get('/mine', authMiddleware, itemsController.getMyItems);
router.get('/:id', itemsController.getItemById);
router.post('/', authMiddleware, upload.single('image'), itemsController.createItem);
router.put('/:id', authMiddleware, upload.single('image'), itemsController.updateItem);
router.delete('/:id', authMiddleware, itemsController.deleteItem);

module.exports = router;
