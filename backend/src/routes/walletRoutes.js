const express = require('express');
const router = express.Router();
const { getNonce, verifySignature } = require('../controllers/walletController');
const { protect } = require('../middleware/authMiddleware');

router.post('/nonce', protect, getNonce);
router.post('/verify', protect, verifySignature);

module.exports = router;
