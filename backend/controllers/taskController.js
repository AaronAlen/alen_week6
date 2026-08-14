const createError = require('http-errors');
const { Task, User, sequelize } = require('../models');
const appEventEmitter = require('../events/taskEvents');

/**
 * TASK CONTROLLER
 * Demonstrates CRUD operations, Pagination, Ownership Checks, JOINs, and Transactions
 * (Uses http-errors package and express-async-errors middleware)
 */

// GET ALL TASKS (With Pagination & SQL JOIN)
exports.getTasks = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  // Build WHERE clause based on role
  // ADMIN can view all tasks; regular USER can only view their own tasks
  const whereClause = req.user.role === 'ADMIN' ? {} : { userId: req.user.userId };

  // Query Optimization: Select required fields and use limit/offset pagination
  // SQL JOIN: Includes creator details from User table
  const { count, rows: tasks } = await Task.findAndCountAll({
    where: whereClause,
    attributes: ['id', 'title', 'description', 'status', 'priority', 'userId', 'createdAt'],
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['name', 'email'] // SQL JOIN: fetch only user name and email
      }
    ],
    limit,
    offset,
    order: [['createdAt', 'DESC']]
  });

  return res.json({
    total: count,
    page,
    totalPages: Math.ceil(count / limit),
    tasks
  });
};

// GET TASK BY ID (With Ownership Check)
exports.getTaskById = async (req, res) => {
  const taskId = req.params.id;

  const task = await Task.findByPk(taskId, {
    include: [{ model: User, as: 'user', attributes: ['name', 'email'] }]
  });

  if (!task) {
    throw createError(404, 'Task not found.');
  }

  // RESOURCE OWNERSHIP CHECK: Users can only access their own tasks unless ADMIN
  if (req.user.role !== 'ADMIN' && task.userId !== req.user.userId) {
    throw createError(403, 'Forbidden. You do not own this task.');
  }

  return res.json({ task });
};

// CREATE TASK (Demonstrating MySQL Transaction & Admin Task Assignment)
exports.createTask = async (req, res) => {
  const { title, description, status, priority, assignedUserId } = req.body;

  if (!title) {
    throw createError(400, 'Task title is required.');
  }

  // Start explicit Sequelize Transaction
  const transaction = await sequelize.transaction();

  try {
    // Check if Admin assigning task(s) to specific user or ALL users
    if (req.user.role === 'ADMIN' && assignedUserId) {
      if (assignedUserId === 'ALL') {
        const allUsers = await User.findAll({ attributes: ['id'], transaction });
        if (allUsers.length === 0) {
          throw createError(400, 'No users found to assign task.');
        }

        const taskRecords = allUsers.map(u => ({
          title,
          description,
          status: status || 'PENDING',
          priority: priority || 'MEDIUM',
          userId: u.id
        }));

        const createdTasks = await Task.bulkCreate(taskRecords, { transaction });
        await transaction.commit();

        appEventEmitter.emit('task.created', {
          userId: req.user.userId,
          count: createdTasks.length,
          title
        });

        return res.status(201).json({
          message: `Task created and assigned to all ${createdTasks.length} users successfully.`,
          count: createdTasks.length,
          task: createdTasks[0]
        });
      } else {
        const targetUserId = parseInt(assignedUserId);
        const targetUser = await User.findByPk(targetUserId, { transaction });
        if (!targetUser) {
          throw createError(404, 'Assigned user not found.');
        }

        const newTask = await Task.create({
          title,
          description,
          status: status || 'PENDING',
          priority: priority || 'MEDIUM',
          userId: targetUserId
        }, { transaction });

        await transaction.commit();

        appEventEmitter.emit('task.created', {
          userId: req.user.userId,
          assignedUserId: targetUserId,
          taskId: newTask.id,
          title: newTask.title
        });

        return res.status(201).json({
          message: `Task created and assigned to ${targetUser.name || 'user'}.`,
          task: newTask
        });
      }
    }

    // Default: Normal user creation or Admin self-assignment
    const newTask = await Task.create({
      title,
      description,
      status: status || 'PENDING',
      priority: priority || 'MEDIUM',
      userId: req.user.userId
    }, { transaction });

    // Commit Transaction (ACID - Atomicity and Consistency)
    await transaction.commit();

    // Emit event for MongoDB Activity Logging (outside transaction)
    appEventEmitter.emit('task.created', {
      userId: req.user.userId,
      taskId: newTask.id,
      title: newTask.title
    });

    return res.status(201).json({
      message: 'Task created successfully.',
      task: newTask
    });

  } catch (error) {
    // Rollback transaction if any step fails
    await transaction.rollback();
    throw error;
  }
};

// UPDATE TASK (With Ownership & Admin Reassignment Check)
exports.updateTask = async (req, res) => {
  const taskId = req.params.id;
  const { title, description, status, priority, assignedUserId } = req.body;

  const task = await Task.findByPk(taskId);

  if (!task) {
    throw createError(404, 'Task not found.');
  }

  // OWNERSHIP CHECK
  if (req.user.role !== 'ADMIN' && task.userId !== req.user.userId) {
    throw createError(403, 'Forbidden. You do not own this task.');
  }

  // Update fields
  task.title = title !== undefined ? title : task.title;
  task.description = description !== undefined ? description : task.description;
  task.status = status !== undefined ? status : task.status;
  task.priority = priority !== undefined ? priority : task.priority;

  if (req.user.role === 'ADMIN' && assignedUserId && assignedUserId !== 'ALL') {
    const targetUserId = parseInt(assignedUserId);
    if (!isNaN(targetUserId)) {
      task.userId = targetUserId;
    }
  }

  await task.save();

  // Emit event for audit log
  appEventEmitter.emit('task.updated', {
    userId: req.user.userId,
    taskId: task.id,
    changes: { title, status, priority }
  });

  return res.json({
    message: 'Task updated successfully.',
    task
  });
};

// DELETE TASK (With Ownership Check)
exports.deleteTask = async (req, res) => {
  const taskId = req.params.id;

  const task = await Task.findByPk(taskId);

  if (!task) {
    throw createError(404, 'Task not found.');
  }

  // OWNERSHIP CHECK
  if (req.user.role !== 'ADMIN' && task.userId !== req.user.userId) {
    throw createError(403, 'Forbidden. You do not own this task.');
  }

  await task.destroy();

  // Emit event for audit log
  appEventEmitter.emit('task.deleted', {
    userId: req.user.userId,
    taskId
  });

  return res.json({ message: 'Task deleted successfully.' });
};
