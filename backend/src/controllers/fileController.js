const File = require('../models/File');
const FileAccess = require('../models/FileAccess');
const User = require('../models/User');
const { encryptBuffer, decryptBuffer } = require('../utils/crypto');
const { uploadToIPFS, fetchFromIPFS } = require('../services/ipfsService');
const {
  uploadFileToBlockchain,
  grantBlockchainAccess,
  revokeBlockchainAccess,
  verifyBlockchainAccess
} = require('../services/blockchainService');
const logActivity = require('../utils/logger');

/**
 * @route   POST /api/files/upload
 * @desc    Encrypt file, upload to IPFS, register on Hardhat Blockchain & save metadata
 * @access  Private (Admin, Editor)
 */
const uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please select a file to upload' });
    }

    if (!req.user.walletAddress) {
      return res.status(400).json({
        success: false,
        message: 'You must connect your MetaMask wallet before uploading files to the blockchain system'
      });
    }

    const originalName = req.file.originalname;
    const mimeType = req.file.mimetype || 'application/octet-stream';
    const size = req.file.size;

    console.log(`[File Controller] Processing upload for '${originalName}' (${size} bytes)`);

    // 1. Encrypt raw file buffer using AES-256-GCM + Master Key Envelope Encryption
    const { encryptedBuffer, iv, authTag, encryptedKey } = encryptBuffer(req.file.buffer);
    console.log(`[File Controller] AES-256-GCM encryption complete. Encrypted payload size: ${encryptedBuffer.length} bytes.`);

    // 2. Upload encrypted buffer to IPFS via Pinata / fallback
    const ipfsResult = await uploadToIPFS(encryptedBuffer, `${Date.now()}_${originalName}.enc`);
    if (!ipfsResult.success || !ipfsResult.cid) {
      return res.status(500).json({ success: false, message: 'Failed to upload encrypted file to IPFS storage' });
    }

    const ipfsCid = ipfsResult.cid;
    console.log(`[File Controller] IPFS upload successful. CID: ${ipfsCid}`);

    // 3. Register file CID reference on Ethereum smart contract
    const blockchainResult = await uploadFileToBlockchain(ipfsCid);
    const { fileId: blockchainFileId, transactionHash } = blockchainResult;

    console.log(`[File Controller] Blockchain transaction complete. File ID: ${blockchainFileId}, TxHash: ${transactionHash}`);

    // 4. Store file record in MongoDB
    const newFile = new File({
      originalName,
      encryptedFileName: `${ipfsCid}.enc`,
      ipfsCid,
      owner: req.user._id,
      ownerWallet: req.user.walletAddress.toLowerCase(),
      blockchainFileId,
      encryptionMetadata: {
        iv,
        authTag,
        encryptedKey
      },
      size,
      mimeType
    });

    await newFile.save();

    // 5. Audit Log
    await logActivity({
      user: req.user._id,
      action: 'FILE_UPLOADED',
      file: newFile._id,
      walletAddress: req.user.walletAddress,
      transactionHash,
      metadata: {
        ipfsCid,
        blockchainFileId,
        size
      }
    });

    res.status(201).json({
      success: true,
      message: 'File encrypted, uploaded to IPFS, and recorded on Ethereum blockchain successfully!',
      file: {
        id: newFile._id,
        originalName: newFile.originalName,
        ipfsCid: newFile.ipfsCid,
        blockchainFileId: newFile.blockchainFileId,
        size: newFile.size,
        mimeType: newFile.mimeType,
        transactionHash,
        createdAt: newFile.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/files
 * @desc    Get files accessible to the current logged in user
 * @access  Private
 */
const getFiles = async (req, res, next) => {
  try {
    let files = [];

    if (req.user.role === 'Admin') {
      // Admin can see all system files
      files = await File.find()
        .populate('owner', 'name email walletAddress')
        .sort({ createdAt: -1 });
    } else {
      // Find own files
      const ownFiles = await File.find({ owner: req.user._id })
        .populate('owner', 'name email walletAddress')
        .sort({ createdAt: -1 });

      // Find files shared with user's wallet
      let sharedFileIds = [];
      if (req.user.walletAddress) {
        const activeAccesses = await FileAccess.find({
          walletAddress: req.user.walletAddress.toLowerCase(),
          revokedAt: null
        });
        sharedFileIds = activeAccesses.map(a => a.file);
      }

      const sharedFiles = await File.find({ _id: { $in: sharedFileIds } })
        .populate('owner', 'name email walletAddress')
        .sort({ createdAt: -1 });

      // Merge & deduplicate
      const fileMap = new Map();
      ownFiles.forEach(f => fileMap.set(f._id.toString(), f));
      sharedFiles.forEach(f => fileMap.set(f._id.toString(), f));

      files = Array.from(fileMap.values());
    }

    res.status(200).json({
      success: true,
      count: files.length,
      files
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/files/shared
 * @desc    Get files explicitly shared with current user
 * @access  Private
 */
const getSharedFiles = async (req, res, next) => {
  try {
    if (!req.user.walletAddress) {
      return res.status(200).json({ success: true, count: 0, files: [] });
    }

    const activeAccesses = await FileAccess.find({
      walletAddress: req.user.walletAddress.toLowerCase(),
      revokedAt: null
    }).populate('grantedBy', 'name email');

    const fileIds = activeAccesses.map(a => a.file);
    const files = await File.find({ _id: { $in: fileIds } })
      .populate('owner', 'name email walletAddress')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: files.length,
      files
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/files/:id
 * @desc    Get details of a specific file
 * @access  Private
 */
const getFileById = async (req, res, next) => {
  try {
    const file = await File.findById(req.params.id).populate('owner', 'name email walletAddress');
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    // Access permissions list
    const activeAccessList = await FileAccess.find({ file: file._id, revokedAt: null })
      .populate('user', 'name email walletAddress')
      .populate('grantedBy', 'name email');

    res.status(200).json({
      success: true,
      file,
      accessList: activeAccessList
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/files/:id/download
 * @desc    Verify blockchain permissions, retrieve from IPFS, decrypt & stream file to browser
 * @access  Private
 */
const downloadFile = async (req, res, next) => {
  try {
    const file = await File.findById(req.params.id).populate('owner', 'name email walletAddress');
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    const userWallet = req.user.walletAddress ? req.user.walletAddress.toLowerCase() : null;
    const isOwner = file.owner._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'Admin';

    let hasBlockchainPermission = false;

    if (isAdmin || isOwner) {
      hasBlockchainPermission = true;
    } else if (userWallet) {
      // Check smart contract on-chain permission
      hasBlockchainPermission = await verifyBlockchainAccess(file.blockchainFileId, userWallet);

      // If smart contract check fails, fallback check MongoDB active access grant
      if (!hasBlockchainPermission) {
        const mongoAccess = await FileAccess.findOne({
          file: file._id,
          walletAddress: userWallet,
          revokedAt: null
        });
        if (mongoAccess) {
          hasBlockchainPermission = true;
        }
      }
    }

    if (!hasBlockchainPermission) {
      await logActivity({
        user: req.user._id,
        action: 'FILE_ACCESSED',
        file: file._id,
        walletAddress: userWallet,
        metadata: { status: 'DENIED_UNAUTHORIZED' }
      });

      return res.status(403).json({
        success: false,
        message: 'Access Denied: You do not have verified permission on the Ethereum blockchain or MongoDB access table to view or download this encrypted file.'
      });
    }

    console.log(`[File Download] Authorization confirmed for user ${req.user.email}. Downloading CID ${file.ipfsCid} from IPFS.`);

    // 1. Fetch encrypted buffer from IPFS
    const encryptedBuffer = await fetchFromIPFS(file.ipfsCid);

    // 2. Decrypt buffer using AES-256-GCM envelope key
    const decryptedBuffer = decryptBuffer(
      encryptedBuffer,
      file.encryptionMetadata.iv,
      file.encryptionMetadata.authTag,
      file.encryptionMetadata.encryptedKey
    );

    console.log(`[File Download] File decrypted successfully. Size: ${decryptedBuffer.length} bytes.`);

    await logActivity({
      user: req.user._id,
      action: 'FILE_ACCESSED',
      file: file._id,
      walletAddress: userWallet,
      metadata: { status: 'SUCCESS_DECRYPTED' }
    });

    // 3. Set headers and stream response
    res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
    res.setHeader('Content-Length', decryptedBuffer.length);
    res.send(decryptedBuffer);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/files/:id/share
 * @desc    Grant access to a target wallet address on Solidity contract & MongoDB
 * @access  Private (Owner / Admin / Editor)
 */
const shareFile = async (req, res, next) => {
  try {
    const { walletAddress, userEmail } = req.body;
    const fileId = req.params.id;

    const file = await File.findById(fileId);
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    // Only Owner or Admin can grant access
    const isOwner = file.owner.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'Admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Only the file owner or Admin can grant access' });
    }

    let targetUser = null;
    let targetWallet = walletAddress ? walletAddress.toLowerCase() : null;

    if (userEmail) {
      targetUser = await User.findOne({ email: userEmail.toLowerCase() });
      if (targetUser && targetUser.walletAddress) {
        targetWallet = targetUser.walletAddress.toLowerCase();
      }
    } else if (targetWallet) {
      targetUser = await User.findOne({ walletAddress: targetWallet });
    }

    if (!targetWallet) {
      return res.status(400).json({
        success: false,
        message: 'Target user must have a registered account with a connected Ethereum wallet'
      });
    }

    console.log(`[Share File] Granting access to ${targetWallet} for file ${file.originalName} (Blockchain ID: ${file.blockchainFileId})`);

    // 1. Send transaction to Solidity smart contract grantAccess()
    const { transactionHash } = await grantBlockchainAccess(file.blockchainFileId, targetWallet);

    // 2. Save or reactivate FileAccess record in MongoDB
    let fileAccess = await FileAccess.findOne({ file: file._id, walletAddress: targetWallet });
    if (fileAccess) {
      fileAccess.revokedAt = null;
      fileAccess.grantedBy = req.user._id;
      if (targetUser) fileAccess.user = targetUser._id;
      await fileAccess.save();
    } else {
      fileAccess = new FileAccess({
        file: file._id,
        user: targetUser ? targetUser._id : req.user._id,
        walletAddress: targetWallet,
        grantedBy: req.user._id
      });
      await fileAccess.save();
    }

    // 3. Log Activity
    await logActivity({
      user: req.user._id,
      targetUser: targetUser ? targetUser._id : null,
      action: 'ACCESS_GRANTED',
      file: file._id,
      walletAddress: targetWallet,
      transactionHash
    });

    res.status(200).json({
      success: true,
      message: `Access successfully granted to wallet ${targetWallet} on Ethereum blockchain!`,
      transactionHash
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/files/:id/share/:walletAddress
 * @desc    Revoke access from a target wallet address on Solidity contract & MongoDB
 * @access  Private (Owner / Admin)
 */
const revokeAccess = async (req, res, next) => {
  try {
    const fileId = req.params.id;
    const targetWallet = req.params.walletAddress.toLowerCase();

    const file = await File.findById(fileId);
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    const isOwner = file.owner.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'Admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Only the file owner or Admin can revoke access' });
    }

    console.log(`[Revoke Access] Revoking access from ${targetWallet} for file ${file.originalName}`);

    // 1. Send transaction to Solidity smart contract revokeAccess()
    const { transactionHash } = await revokeBlockchainAccess(file.blockchainFileId, targetWallet);

    // 2. Mark access revoked in MongoDB
    const fileAccess = await FileAccess.findOne({ file: file._id, walletAddress: targetWallet });
    if (fileAccess) {
      fileAccess.revokedAt = new Date();
      await fileAccess.save();
    }

    // 3. Log Activity
    await logActivity({
      user: req.user._id,
      action: 'ACCESS_REVOKED',
      file: file._id,
      walletAddress: targetWallet,
      transactionHash
    });

    res.status(200).json({
      success: true,
      message: `Access successfully revoked for wallet ${targetWallet} on Ethereum blockchain!`,
      transactionHash
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/files/:id
 * @desc    Delete a file record and permissions
 * @access  Private (Owner / Admin)
 */
const deleteFile = async (req, res, next) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    const isOwner = file.owner.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'Admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Only the file owner or Admin can delete this file' });
    }

    await FileAccess.deleteMany({ file: file._id });
    await File.findByIdAndDelete(file._id);

    await logActivity({
      user: req.user._id,
      action: 'FILE_DELETED',
      file: file._id,
      metadata: { originalName: file.originalName, ipfsCid: file.ipfsCid }
    });

    res.status(200).json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadFile,
  getFiles,
  getSharedFiles,
  getFileById,
  downloadFile,
  shareFile,
  revokeAccess,
  deleteFile
};
