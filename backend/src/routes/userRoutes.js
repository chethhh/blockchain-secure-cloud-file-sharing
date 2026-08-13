const express = require('express');
const router = express.Router();
const { getUsers, getUserById, updateWallet, updateUserRole } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.get('/', protect, authorizeRoles('Admin'), getUsers);
router.put('/wallet', protect, updateWallet);
router.get('/:id', protect, getUserById);
router.put('/:id/role', protect, authorizeRoles('Admin'), updateUserRole);

module.exports = router;
