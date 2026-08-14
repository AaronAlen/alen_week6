const EventEmitter = require('events');
const ActivityLog = require('../models/ActivityLog');

/**
 * EVENT-DRIVEN AUDIT LOGGING SYSTEM (Node.js EventEmitter)
 * 
 * Why EventEmitter?
 * Decouples main business logic (HTTP request controllers) from logging tasks.
 * Controllers simply emit an event (e.g. 'task.created'). The listener handles saving
 * to MongoDB asynchronously without blocking the user response.
 */
class TaskAppEventEmitter extends EventEmitter {}

const appEventEmitter = new TaskAppEventEmitter();

// EVENT LISTENERS -> MongoDB ActivityLog creation
appEventEmitter.on('user.registered', async (data) => {
  try {
    await ActivityLog.create({
      userId: data.userId,
      action: 'USER_REGISTERED',
      details: { email: data.email, name: data.name }
    });
  } catch (err) {
    console.error('Error logging user.registered event:', err.message);
  }
});

appEventEmitter.on('user.login', async (data) => {
  try {
    await ActivityLog.create({
      userId: data.userId,
      action: 'USER_LOGIN',
      details: { ip: data.ip || '127.0.0.1' }
    });
  } catch (err) {
    console.error('Error logging user.login event:', err.message);
  }
});

appEventEmitter.on('task.created', async (data) => {
  try {
    await ActivityLog.create({
      userId: data.userId,
      action: 'TASK_CREATED',
      details: { taskId: data.taskId, title: data.title }
    });
  } catch (err) {
    console.error('Error logging task.created event:', err.message);
  }
});

appEventEmitter.on('task.updated', async (data) => {
  try {
    await ActivityLog.create({
      userId: data.userId,
      action: 'TASK_UPDATED',
      details: { taskId: data.taskId, changes: data.changes }
    });
  } catch (err) {
    console.error('Error logging task.updated event:', err.message);
  }
});

appEventEmitter.on('task.deleted', async (data) => {
  try {
    await ActivityLog.create({
      userId: data.userId,
      action: 'TASK_DELETED',
      details: { taskId: data.taskId }
    });
  } catch (err) {
    console.error('Error logging task.deleted event:', err.message);
  }
});

appEventEmitter.on('role.changed', async (data) => {
  try {
    await ActivityLog.create({
      userId: data.adminUserId,
      action: 'ROLE_CHANGED',
      details: { targetUserId: data.targetUserId, newRole: data.newRole }
    });
  } catch (err) {
    console.error('Error logging role.changed event:', err.message);
  }
});

module.exports = appEventEmitter;
