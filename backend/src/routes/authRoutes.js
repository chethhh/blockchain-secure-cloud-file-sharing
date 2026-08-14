const express = require('express');
const router = express.Router();

const {
  register,
  login,
  verifyOtp,
  resendOtp,
  getMe
} = require('../controllers/authController');

const { protect } = require('../middleware/authMiddleware');

// Authentication routes
router.post('/register', register);
router.post('/login', login);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);

// Protected user route
router.get('/me', protect, getMe);

module.exports = router;