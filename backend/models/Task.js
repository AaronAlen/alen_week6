const { DataTypes } = require('sequelize');
const sequelize = require('../config/mysql');

/**
 * TASK MODEL (MySQL)
 * 
 * Represents tasks created by users.
 * Uses Foreign Key `userId` to link back to the `users` table.
 * Includes indexes on `userId` and `status` for fast query filtering.
 */
const Task = sequelize.define('Task', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED'),
    defaultValue: 'PENDING',
    allowNull: false
  },
  priority: {
    type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH'),
    defaultValue: 'MEDIUM',
    allowNull: false
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'tasks',
  timestamps: true,
  // INDEXING: Optimizes query speed for filtering tasks by user or status
  indexes: [
    { fields: ['userId'] },
    { fields: ['status'] }
  ]
});

module.exports = Task;
