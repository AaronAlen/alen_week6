const mongoose = require('mongoose');

/**
 * ACTIVITY LOG MODEL (MongoDB via Mongoose)
 * 
 * Used for storing system audit logs. Unlike SQL, MongoDB allows dynamic `details` payloads
 * without requiring schema migration when new log metadata is introduced.
 */
const activityLogSchema = new mongoose.Schema({
  userId: {
    type: Number,
    required: true,
    index: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'USER_REGISTERED',
      'USER_LOGIN',
      'TASK_CREATED',
      'TASK_UPDATED',
      'TASK_DELETED',
      'ROLE_CHANGED'
    ]
  },
  details: {
    type: Object,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ActivityLog', activityLogSchema);
