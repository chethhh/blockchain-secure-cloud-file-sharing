const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { generateOTP, hashOTP, verifyOTP, sendOTPEmail } = require('../utils/otp');
const logActivity = require('../utils/logger');

// In-Memory User Fallback Store for zero-config production reliability
const inMemoryUsers = new Map();

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
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email and password' });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }

    const lowerEmail = email.toLowerCase().trim();
    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      const existingUser = await User.findOne({ email: lowerEmail });
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'An account with this email already exists' });
      }

      const user = new User({
        name,
        email: lowerEmail,
        password,
        role: 'Viewer'
      });
      await user.save();

      await logActivity({
        user: user._id,
        action: 'REGISTER',
        metadata: { role: 'Viewer' }
      });
    } else {
      // In-Memory Database Fallback Mode
      if (inMemoryUsers.has(lowerEmail)) {
        return res.status(400).json({ success: false, message: 'An account with this email already exists' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const mockId = new mongoose.Types.ObjectId().toString();

      const memoryUser = {
        _id: mockId,
        id: mockId,
        name,
        email: lowerEmail,
        password: hashedPassword,
        role: 'Viewer',
        walletAddress: null,
        isEmailVerified: false,
        otpHash: null,
        otpExpiresAt: null,
        otpAttempts: 0
      };

      inMemoryUsers.set(lowerEmail, memoryUser);
      console.log(`[Memory DB Fallback] Registered user: ${lowerEmail}`);
    }

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

    const lowerEmail = email.toLowerCase().trim();
    const isDbConnected = mongoose.connection.readyState === 1;

    let user = null;
    let isMatch = false;

    if (isDbConnected) {
      user = await User.findOne({ email: lowerEmail }).select('+password');
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }
      isMatch = await user.matchPassword(password);
    } else {
      user = inMemoryUsers.get(lowerEmail);
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }
      isMatch = await bcrypt.compare(password, user.password);
    }

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Generate 6-digit OTP
    const otp = generateOTP();
    const otpHash = hashOTP(otp);
    const expiresMinutes = parseInt(process.env.OTP_EXPIRES_MINUTES || '5');

    if (isDbConnected) {
      user.otpHash = otpHash;
      user.otpExpiresAt = new Date(Date.now() + expiresMinutes * 60 * 1000);
      user.otpAttempts = 0;
      await user.save();
    } else {
      user.otpHash = otpHash;
      user.otpExpiresAt = new Date(Date.now() + expiresMinutes * 60 * 1000);
      user.otpAttempts = 0;
      inMemoryUsers.set(lowerEmail, user);
    }

    await sendOTPEmail(user.email, otp);

    res.status(200).json({
      success: true,
      message: `OTP sent to your email. Expire in ${expiresMinutes} minutes.`,
      email: user.email,
      otp: process.env.DEV_LOG_OTP === 'true' ? otp : undefined
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

    const lowerEmail = email.toLowerCase().trim();
    const isDbConnected = mongoose.connection.readyState === 1;

    let user = null;
    if (isDbConnected) {
      user = await User.findOne({ email: lowerEmail });
    } else {
      user = inMemoryUsers.get(lowerEmail);
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.otpHash || !user.otpExpiresAt) {
      return res.status(400).json({ success: false, message: 'No pending OTP verification request found. Please login again.' });
    }

    const expiresAt = user.otpExpiresAt instanceof Date ? user.otpExpiresAt.getTime() : new Date(user.otpExpiresAt).getTime();
    if (Date.now() > expiresAt) {
      return res.status(400).json({ success: false, message: 'OTP code has expired. Please request a new one.' });
    }

    const maxAttempts = parseInt(process.env.OTP_MAX_ATTEMPTS || '5');
    if (user.otpAttempts >= maxAttempts) {
      return res.status(400).json({ success: false, message: 'Maximum OTP verification attempts exceeded. Please login again.' });
    }

    const isValid = verifyOTP(otp, user.otpHash);
    if (!isValid) {
      user.otpAttempts += 1;
      if (isDbConnected) await user.save();
      else inMemoryUsers.set(lowerEmail, user);
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
    if (isDbConnected) await user.save();
    else inMemoryUsers.set(lowerEmail, user);

    const token = generateToken(user._id || user.id, user.email, user.role);

    res.status(200).json({
      success: true,
      message: 'Authentication successful',
      token,
      user: {
        id: user._id || user.id,
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
