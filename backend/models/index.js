const sequelize = require('../config/mysql');
const User = require('./User');
const Task = require('./Task');

/**
 * SEQUELIZE MODEL RELATIONSHIPS (1:N Normalization)
 * 
 * User 1 ---- N Tasks
 * - One user can have many tasks.
 * - Each task belongs to exactly one user via foreign key `userId`.
 */
User.hasMany(Task, { foreignKey: 'userId', onDelete: 'CASCADE' });
Task.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = {
  sequelize,
  User,
  Task
};
