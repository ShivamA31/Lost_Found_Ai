const express = require('express');
const router = express.Router();
const metaController = require('../controllers/metaController');

router.get('/summary', metaController.getSummary);
router.get('/categories', metaController.getCategories);
router.get('/locations', metaController.getLocations);

module.exports = router;
