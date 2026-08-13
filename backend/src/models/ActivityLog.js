const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false
    },
    action: {
      type: String,
      required: true,
      enum: [
        'REGISTER',
        'LOGIN',
        'OTP_VERIFIED',
        'WALLET_CONNECTED',
        'FILE_UPLOADED',
        'FILE_ACCESSED',
        'ACCESS_GRANTED',
        'ACCESS_REVOKED',
        'FILE_DELETED'
      ]
    },
    file: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'File',
      required: false
    },
    targetUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false
    },
    walletAddress: {
      type: String,
      default: null,
      lowercase: true
    },
    transactionHash: {
      type: String,
      default: null
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('ActivityLog', activityLogSchema);
