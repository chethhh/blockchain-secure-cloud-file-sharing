const { ethers } = require('ethers');
const crypto = require('crypto');
const User = require('../models/User');
const logActivity = require('../utils/logger');

// Nonce cache store (In-memory map indexed by User ID)
const nonceStore = new Map();

/**
 * @route   POST /api/wallet/nonce
 * @desc    Generate a random cryptographic challenge nonce for wallet signing
 * @access  Private
 */
const getNonce = async (req, res, next) => {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress || !walletAddress.startsWith('0x')) {
      return res.status(400).json({ success: false, message: 'Valid Ethereum wallet address required' });
    }

    const randomBytes = crypto.randomBytes(16).toString('hex');
    const nonce = `Sign this message to prove ownership of wallet ${walletAddress} for Secure Cloud File Sharing. Nonce: ${randomBytes}`;

    nonceStore.set(req.user._id.toString(), {
      nonce,
      walletAddress: walletAddress.toLowerCase(),
      createdAt: Date.now()
    });

    res.status(200).json({
      success: true,
      nonce
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/wallet/verify
 * @desc    Verify signature of challenge nonce using ethers.js and bind wallet to account
 * @access  Private
 */
const verifySignature = async (req, res, next) => {
  try {
    const { signature, walletAddress } = req.body;

    if (!signature || !walletAddress) {
      return res.status(400).json({ success: false, message: 'Signature and wallet address are required' });
    }

    const storedData = nonceStore.get(req.user._id.toString());
    if (!storedData) {
      return res.status(400).json({ success: false, message: 'Nonce session expired or non-existent. Please request a new nonce.' });
    }

    // Recover address from signature
    const recoveredAddress = ethers.verifyMessage(storedData.nonce, signature);

    if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: 'Wallet ownership verification failed. Recovered address does not match provided address.'
      });
    }

    // Bind wallet to user profile in MongoDB
    const user = await User.findById(req.user._id);
    user.walletAddress = walletAddress.toLowerCase();
    await user.save();

    // Clear stored nonce
    nonceStore.delete(req.user._id.toString());

    await logActivity({
      user: user._id,
      action: 'WALLET_CONNECTED',
      walletAddress: user.walletAddress
    });

    res.status(200).json({
      success: true,
      message: 'MetaMask wallet ownership successfully verified and linked!',
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

module.exports = {
  getNonce,
  verifySignature
};
