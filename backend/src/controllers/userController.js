const User = require('../models/User');
const logActivity = require('../utils/logger');

/**
 * @route   GET /api/users
 * @desc    Get list of all users (Admin only)
 * @access  Private/Admin
 */
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private
 */
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/users/wallet
 * @desc    Associate verified Ethereum wallet address to logged in user profile
 * @access  Private
 */
const updateWallet = async (req, res, next) => {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress || !walletAddress.startsWith('0x')) {
      return res.status(400).json({ success: false, message: 'Invalid Ethereum wallet address provided' });
    }

    const lowerAddress = walletAddress.toLowerCase();

    // Check if wallet is already claimed by another account
    const existingWalletOwner = await User.findOne({
      walletAddress: lowerAddress,
      _id: { $ne: req.user._id }
    });

    if (existingWalletOwner) {
      return res.status(400).json({
        success: false,
        message: 'This wallet address is already linked to another registered account'
      });
    }

    const user = await User.findById(req.user._id);
    user.walletAddress = lowerAddress;
    await user.save();

    await logActivity({
      user: user._id,
      action: 'WALLET_CONNECTED',
      walletAddress: lowerAddress
    });

    res.status(200).json({
      success: true,
      message: 'Wallet address successfully linked to profile',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        walletAddress: user.walletAddress
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/users/:id/role
 * @desc    Update user role (Admin only)
 * @access  Private/Admin
 */
const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;

    if (!['Admin', 'Editor', 'Viewer'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role specified' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const oldRole = user.role;
    user.role = role;
    await user.save();

    await logActivity({
      user: req.user._id,
      targetUser: user._id,
      action: 'ROLE_UPDATED',
      metadata: { from: oldRole, to: role }
    });

    res.status(200).json({
      success: true,
      message: `User role updated from ${oldRole} to ${role}`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getUserById,
  updateWallet,
  updateUserRole
};
