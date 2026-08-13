const express = require('express');
const router = express.Router();
const {
  uploadFile,
  getFiles,
  getSharedFiles,
  getFileById,
  downloadFile,
  shareFile,
  revokeAccess,
  deleteFile
} = require('../controllers/fileController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/upload', protect, authorizeRoles('Admin', 'Editor'), upload.single('file'), uploadFile);
router.get('/', protect, getFiles);
router.get('/shared', protect, getSharedFiles);
router.get('/:id', protect, getFileById);
router.get('/:id/download', protect, downloadFile);
router.post('/:id/share', protect, authorizeRoles('Admin', 'Editor'), shareFile);
router.delete('/:id/share/:walletAddress', protect, authorizeRoles('Admin', 'Editor'), revokeAccess);
router.delete('/:id', protect, authorizeRoles('Admin', 'Editor'), deleteFile);

module.exports = router;
