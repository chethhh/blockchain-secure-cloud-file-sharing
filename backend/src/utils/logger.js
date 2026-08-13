const ActivityLog = require('../models/ActivityLog');

/**
 * Creates a persistent audit activity log in MongoDB
 */
async function logActivity({
  user = null,
  action,
  file = null,
  targetUser = null,
  walletAddress = null,
  transactionHash = null,
  metadata = {}
}) {
  try {
    const log = new ActivityLog({
      user,
      action,
      file,
      targetUser,
      walletAddress,
      transactionHash,
      metadata,
      timestamp: new Date()
    });
    await log.save();
    console.log(`[Audit Log] ${action} executed by user: ${user || 'Guest'}`);
    return log;
  } catch (error) {
    console.error(`[Audit Log Error] Failed to persist log: ${error.message}`);
  }
}

module.exports = logActivity;
