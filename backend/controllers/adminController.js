const { User } = require('../models');
const ActivityLog = require('../models/ActivityLog');
const appEventEmitter = require('../events/taskEvents');

/**
 * ADMIN CONTROLLER
 * Handles User Management & MongoDB Aggregation Stats (Protected by authorize('ADMIN'))
 */

// GET ALL USERS
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'role', 'createdAt'] // Exclude password hash
    });

    return res.json({ users });
  } catch (error) {
    return res.status(500).json({ message: 'Error retrieving user list.' });
  }
};

// CHANGE USER ROLE (USER <-> ADMIN)
exports.updateUserRole = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const { role } = req.body;

    if (!['USER', 'ADMIN'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role specified.' });
    }

    const user = await User.findByPk(targetUserId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    user.role = role;
    await user.save();

    // Emit event for MongoDB Audit Log
    appEventEmitter.emit('role.changed', {
      adminUserId: req.user.userId,
      targetUserId: user.id,
      newRole: role
    });

    return res.json({ message: `User role updated to ${role}.`, user });
  } catch (error) {
    return res.status(500).json({ message: 'Error updating user role.' });
  }
};

// DELETE USER
exports.deleteUser = async (req, res) => {
  try {
    const targetUserId = req.params.id;

    if (parseInt(targetUserId) === req.user.userId) {
      return res.status(400).json({ message: 'Admins cannot delete their own account.' });
    }

    const user = await User.findByPk(targetUserId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    await user.destroy();
    return res.json({ message: 'User deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ message: 'Error deleting user.' });
  }
};

// MONGODB AGGREGATION PIPELINE (Activity Statistics)
exports.getActivityStats = async (req, res) => {
  try {
    /**
     * MONGODB AGGREGATION PIPELINE ($group stage)
     * 
     * Aggregates activity log documents by grouping on the `action` field
     * and calculating the total sum of logs per action.
     */
    const stats = await ActivityLog.aggregate([
      {
        $group: {
          _id: '$action',     // Grouping key
          count: { $sum: 1 }  // Increment count by 1 for each matching document
        }
      },
      {
        $sort: { count: -1 } // Sort by count descending
      }
    ]);

    // Also fetch recent 20 activity logs for visual inspection
    const recentLogs = await ActivityLog.find().sort({ createdAt: -1 }).limit(20);

    return res.json({
      stats,
      recentLogs
    });

  } catch (error) {
    console.error('getActivityStats error:', error);
    return res.status(500).json({ message: 'Error generating activity statistics.' });
  }
};
