const express = require('express');
const router = express.Router();
const claimsController = require('../controllers/claimsController');
const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/role');

router.post('/', authMiddleware, claimsController.createClaim);
router.get('/:matchId/info', authMiddleware, claimsController.getClaimInfo);
router.get('/mine', authMiddleware, claimsController.getMyClaims);
router.get('/', authMiddleware, roleMiddleware(['ADMIN']), claimsController.getAllClaims);
router.put('/:id', authMiddleware, roleMiddleware(['ADMIN']), claimsController.updateClaimStatus);

module.exports = router;
