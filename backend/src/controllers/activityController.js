const ActivityLog = require('../models/ActivityLog');

/**
 * @route   GET /api/activity
 * @desc    Get activity logs (Admin gets all system logs; non-admins get personal logs)
 * @access  Private
 */
const getActivityLogs = async (req, res, next) => {
  try {
    let query = {};
    if (req.user.role !== 'Admin') {
      query.user = req.user._id;
    }

    const logs = await ActivityLog.find(query)
      .populate('user', 'name email role walletAddress')
      .populate('targetUser', 'name email walletAddress')
      .populate('file', 'originalName ipfsCid blockchainFileId')
      .sort({ timestamp: -1 })
      .limit(100);

    res.status(200).json({
      success: true,
      count: logs.length,
      logs
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getActivityLogs };
