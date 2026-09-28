const { Sequelize } = require('sequelize');
require('dotenv').config();

/**
 * SEQUELIZE CONNECTION & CONNECTION POOLING
 * 
 * Supports both local development (localhost) and cloud-hosted MySQL databases
 * (TiDB Cloud, Aiven, Railway, AWS RDS, etc.) via connection URI or separate credentials.
 */

const isProduction = process.env.NODE_ENV === 'production';
const dbUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;

// Remote cloud MySQL databases (TiDB, Aiven, etc.) require SSL
const useSSL = process.env.MYSQL_SSL === 'true' || 
  Boolean(dbUrl && !dbUrl.includes('localhost') && !dbUrl.includes('127.0.0.1')) ||
  (Boolean(process.env.MYSQL_HOST) && process.env.MYSQL_HOST !== 'localhost' && process.env.MYSQL_HOST !== '127.0.0.1');

const dialectOptions = useSSL ? {
  ssl: {
    require: true,
    rejectUnauthorized: false
  }
} : {};

const poolConfig = {
  max: 10,        // Maximum active connections in pool
  min: 0,         // Minimum connections in pool
  acquire: 30000, // Maximum time (ms) Sequelize will try to get a connection before throwing error
  idle: 10000     // Maximum time (ms) a connection can be idle before being released
};

const sequelize = dbUrl
  ? new Sequelize(dbUrl, {
      dialect: 'mysql',
      logging: isProduction ? false : console.log,
      dialectOptions,
      pool: poolConfig
    })
  : new Sequelize(
      process.env.MYSQL_DATABASE || 'week6_task_manager',
      process.env.MYSQL_USER || 'root',
      process.env.MYSQL_PASSWORD || '',
      {
        host: process.env.MYSQL_HOST || 'localhost',
        port: Number(process.env.MYSQL_PORT) || 3306,
        dialect: 'mysql',
        logging: isProduction ? false : console.log,
        dialectOptions,
        pool: poolConfig
      }
    );

module.exports = sequelize;

