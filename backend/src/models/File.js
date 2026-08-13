const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema(
  {
    originalName: {
      type: String,
      required: true
    },
    encryptedFileName: {
      type: String,
      required: true
    },
    ipfsCid: {
      type: String,
      required: true
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    ownerWallet: {
      type: String,
      required: true,
      lowercase: true
    },
    blockchainFileId: {
      type: Number,
      required: true
    },
    encryptionMetadata: {
      iv: { type: String, required: true },
      authTag: { type: String, required: true },
      encryptedKey: { type: String, required: true } // Key encrypted using MASTER_ENCRYPTION_KEY
    },
    size: {
      type: Number,
      required: true
    },
    mimeType: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('File', fileSchema);
