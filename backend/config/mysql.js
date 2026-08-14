const { Sequelize } = require('sequelize');
require('dotenv').config();

/**
 * SEQUELIZE CONNECTION & CONNECTION POOLING
 * 
 * What is Connection Pooling?
 * Without pooling: Each HTTP request opens a new network connection to MySQL and closes it after.
 * Opening/closing TCP connections is slow and resource-heavy.
 * 
 * With pooling: Sequelize maintains a reusable pool of open connections. When a query needs to run,
 * it borrows an existing connection from the pool and returns it when done.
 */

const sequelize = new Sequelize(
  process.env.MYSQL_DATABASE || 'week6_task_manager',
  process.env.MYSQL_USER || 'root',
  process.env.MYSQL_PASSWORD || '',
  {
    host: process.env.MYSQL_HOST || 'localhost',
    port: process.env.MYSQL_PORT || 3306,
    dialect: 'mysql',
    logging: console.log, // Log SQL queries so we can see JOINs, Indexes, and Transactions in action!

    // CONNECTION POOL CONFIGURATION
    pool: {
      max: 10,       // Maximum number of active connections in pool
      min: 0,        // Minimum number of connections in pool
      acquire: 30000, // Maximum time (ms) Sequelize will try to get a connection before throwing error
      idle: 10000    // Maximum time (ms) a connection can be idle before being released
    }
  }
);

module.exports = sequelize;
