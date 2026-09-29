const createError = require('http-errors');
const { User, Task } = require('../models');
const ActivityLog = require('../models/ActivityLog');
const appEventEmitter = require('../events/taskEvents');
const { Op } = require('sequelize');

/**
 * ADMIN CONTROLLER
 * Handles User Management & MongoDB Aggregation Stats (Protected by authorize('ADMIN'))
 * (Uses http-errors package and express-async-errors middleware)
 */

// GET ALL USERS
exports.getAllUsers = async (req, res) => {
  const users = await User.findAll({
    attributes: ['id', 'name', 'email', 'role', 'createdAt'] // Exclude password hash
  });

  return res.json({ users });
};

// CHANGE USER ROLE (USER <-> ADMIN)
exports.updateUserRole = async (req, res) => {
  const targetUserId = req.params.id;
  const { role } = req.body;

  if (!['USER', 'ADMIN'].includes(role)) {
    throw createError(400, 'Invalid role specified.');
  }

  const user = await User.findByPk(targetUserId);
  if (!user) {
    throw createError(404, 'User not found.');
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
};

// DELETE USER
exports.deleteUser = async (req, res) => {
  const targetUserId = req.params.id;

  if (parseInt(targetUserId) === req.user.userId) {
    throw createError(400, 'Admins cannot delete their own account.');
  }

  const user = await User.findByPk(targetUserId);
  if (!user) {
    throw createError(404, 'User not found.');
  }

  await user.destroy();
  return res.json({ message: 'User deleted successfully.' });
};

// MONGODB AGGREGATION PIPELINE (Activity Statistics)
exports.getActivityStats = async (req, res) => {
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
};

// CLEAN / RESET BOTH DATABASES (MySQL + MongoDB)
exports.clearDatabases = async (req, res) => {
  const currentAdminId = req.user.userId;

  // 1. MySQL: Delete all tasks
  const deletedTasks = await Task.destroy({ where: {} });

  // 2. MySQL: Delete other users (keep the active logged-in admin so session isn't broken)
  const deletedUsers = await User.destroy({
    where: {
      id: { [Op.ne]: currentAdminId }
    }
  });

  // 3. MongoDB: Delete all activity/audit logs
  const mongoResult = await ActivityLog.deleteMany({});

  // 4. Record new initial clean audit event in MongoDB
  try {
    await ActivityLog.create({
      userId: currentAdminId,
      action: 'DATABASES_CLEARED',
      details: {
        tasksDeleted: deletedTasks,
        usersDeleted: deletedUsers,
        logsDeleted: mongoResult.deletedCount,
        adminId: currentAdminId,
        timestamp: new Date()
      }
    });
  } catch (logErr) {
    console.error('Failed to record DATABASES_CLEARED log:', logErr.message);
  }

  return res.json({
    message: 'Both MySQL and MongoDB databases have been successfully cleaned!',
    summary: {
      tasksDeleted: deletedTasks,
      usersDeleted: deletedUsers,
      logsDeleted: mongoResult.deletedCount
    }
  });
};

