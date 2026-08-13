const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { generateOTP, hashOTP, verifyOTP, sendOTPEmail } = require('../utils/otp');
const logActivity = require('../utils/logger');

// Generate JWT helper
const generateToken = (userId, email, role) => {
  return jwt.sign(
    { userId, email, role },
    process.env.JWT_SECRET || 'super_secret_jwt_key',
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );
};

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user account
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email and password' });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists' });
    }

    // Self-registered users default to 'Viewer'. Only Admin can upgrade role.
    const userRole = 'Viewer';

    const user = new User({
      name,
      email,
      password,
      role: userRole
    });

    await user.save();

    await logActivity({
      user: user._id,
      action: 'REGISTER',
      metadata: { role: userRole }
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please log in to complete OTP verification.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Verify credentials and send OTP MFA code
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Generate 6-digit OTP
    const otp = generateOTP();
    const otpHash = hashOTP(otp);
    const expiresMinutes = parseInt(process.env.OTP_EXPIRES_MINUTES || '5');

    user.otpHash = otpHash;
    user.otpExpiresAt = new Date(Date.now() + expiresMinutes * 60 * 1000);
    user.otpAttempts = 0;
    await user.save();

    // Dispatch OTP via Nodemailer or Console Log
    await sendOTPEmail(user.email, otp);

    await logActivity({
      user: user._id,
      action: 'LOGIN',
      metadata: { step: 'OTP_SENT' }
    });

    res.status(200).json({
      success: true,
      message: `OTP sent to your email. Expire in ${expiresMinutes} minutes.`,
      email: user.email
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/verify-otp
 * @desc    Verify 6-digit OTP and issue JWT Token
 * @access  Public
 */
const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and 6-digit OTP are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.otpHash || !user.otpExpiresAt) {
      return res.status(400).json({ success: false, message: 'No pending OTP verification request found. Please login again.' });
    }

    if (Date.now() > user.otpExpiresAt.getTime()) {
      return res.status(400).json({ success: false, message: 'OTP code has expired. Please request a new one.' });
    }

    const maxAttempts = parseInt(process.env.OTP_MAX_ATTEMPTS || '5');
    if (user.otpAttempts >= maxAttempts) {
      return res.status(400).json({ success: false, message: 'Maximum OTP verification attempts exceeded. Please login again.' });
    }

    const isValid = verifyOTP(otp, user.otpHash);
    if (!isValid) {
      user.otpAttempts += 1;
      await user.save();
      return res.status(400).json({
        success: false,
        message: `Invalid OTP code. ${maxAttempts - user.otpAttempts} attempt(s) remaining.`
      });
    }

    // Mark verified & clear OTP fields
    user.isEmailVerified = true;
    user.otpHash = null;
    user.otpExpiresAt = null;
    user.otpAttempts = 0;
    await user.save();

    // Issue signed JWT
    const token = generateToken(user._id, user.email, user.role);

    await logActivity({
      user: user._id,
      action: 'OTP_VERIFIED',
      metadata: { role: user.role }
    });

    res.status(200).json({
      success: true,
      message: 'Authentication successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        walletAddress: user.walletAddress,
        isEmailVerified: user.isEmailVerified
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/resend-otp
 * @desc    Resend OTP to user email
 * @access  Public
 */
const resendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const otp = generateOTP();
    const otpHash = hashOTP(otp);
    const expiresMinutes = parseInt(process.env.OTP_EXPIRES_MINUTES || '5');

    user.otpHash = otpHash;
    user.otpExpiresAt = new Date(Date.now() + expiresMinutes * 60 * 1000);
    user.otpAttempts = 0;
    await user.save();

    await sendOTPEmail(user.email, otp);

    res.status(200).json({
      success: true,
      message: `A new OTP has been dispatched to ${user.email}`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/auth/me
 * @desc    Get currently logged in user profile
 * @access  Private
 */
const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user
  });
};

module.exports = {
  register,
  login,
  verifyOtp,
  resendOtp,
  getMe
};
