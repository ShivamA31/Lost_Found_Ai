const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/role');

router.use(authMiddleware, roleMiddleware(['ADMIN']));

router.get('/dashboard', adminController.getDashboardStats);
// other CRUDs could go here...

module.exports = router;
