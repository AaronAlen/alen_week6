const { DataTypes } = require('sequelize');
const sequelize = require('../config/mysql');

/**
 * USER MODEL (MySQL)
 * 
 * Represents application users with role-based permissions (USER or ADMIN).
 * Includes database indexing on the email column for fast authentication lookups.
 */
const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false // Will store bcrypt hash, never plain text
  },
  role: {
    type: DataTypes.ENUM('USER', 'ADMIN'),
    defaultValue: 'USER',
    allowNull: false
  }
}, {
  tableName: 'users',
  timestamps: true,
  // INDEXING: Fast B-Tree lookup for emails during Login
  indexes: [
    {
      unique: true,
      fields: ['email']
    }
  ]
});

module.exports = User;
