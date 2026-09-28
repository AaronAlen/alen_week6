const { Sequelize } = require('sequelize');
require('dotenv').config();

/**
 * SEQUELIZE CONNECTION & CONNECTION POOLING
 * 
 * Supports both local development (localhost) and cloud-hosted MySQL databases
 * (TiDB Cloud, Aiven, Railway, AWS RDS, etc.) via connection URI or separate credentials.
 */

const isProduction = process.env.NODE_ENV === 'production';
const rawUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;

let dbConfig = null;

if (rawUrl) {
  try {
    const urlObj = new URL(rawUrl);
    const pathDb = urlObj.pathname.replace(/^\//, '');
    dbConfig = {
      database: pathDb || process.env.MYSQL_DATABASE || 'test',
      username: decodeURIComponent(urlObj.username),
      password: decodeURIComponent(urlObj.password),
      host: urlObj.hostname,
      port: Number(urlObj.port) || 4000,
    };
  } catch (err) {
    console.error('Failed to parse MYSQL_URL:', err.message);
  }
}

const host = dbConfig?.host || process.env.MYSQL_HOST || 'localhost';
const database = dbConfig?.database || process.env.MYSQL_DATABASE || 'week6_task_manager';
const username = dbConfig?.username || process.env.MYSQL_USER || 'root';
const password = dbConfig?.password !== undefined ? dbConfig.password : (process.env.MYSQL_PASSWORD || '');
const port = dbConfig?.port || Number(process.env.MYSQL_PORT) || 3306;

// Remote cloud MySQL databases (TiDB, Aiven, etc.) require SSL
const useSSL = process.env.MYSQL_SSL === 'true' || 
  (host && host !== 'localhost' && host !== '127.0.0.1');

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

const sequelize = new Sequelize(database, username, password, {
  host,
  port,
  dialect: 'mysql',
  logging: isProduction ? false : console.log,
  dialectOptions,
  pool: poolConfig
});

module.exports = sequelize;

