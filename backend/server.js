require('dotenv').config();
const app = require('./app');
const { sequelize, User, Task } = require('./models');
const connectMongoDB = require('./config/mongodb');


const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // 1. Connect and Sync MySQL Database via Sequelize
    const dbName = sequelize.config.database;
    const dbHost = `${sequelize.config.host}:${sequelize.config.port}/${dbName}`;
    console.log(`Connecting to MySQL database at: ${dbHost}...`);

    await sequelize.authenticate();
    console.log(`MySQL Database "${dbName}" connected successfully.`);

    // Check currently selected database
    const [dbInfo] = await sequelize.query('SELECT DATABASE() AS currentDb;');
    const activeDb = dbInfo[0]?.currentDb;
    console.log(`Active MySQL database schema: "${activeDb || 'NONE'}"`);
    
    // Sync models (creates tables & indexes if they don't exist)
    await sequelize.sync({ alter: false });
    console.log('MySQL Models & Indexes synced.');

    // Auto-seed initial demo accounts if database is empty
    const userCount = await User.count();
    if (userCount === 0) {
      console.log('Seeding initial demo accounts into database...');
      const admin = await User.create({
        name: 'Admin User',
        email: 'admin@taskshield.com',
        password: '$2b$10$n0XDqdOWA6qnN0jvEzul1ecoNtSS2jOTDbFNNq7zG//ZF0DxUxnU.', // AdminPassword123!
        role: 'ADMIN'
      });

      const regular = await User.create({
        name: 'Regular User',
        email: 'user@taskshield.com',
        password: '$2b$10$8Q6.cOS2QO.pBLC2IrIiB.D8GxXLaa84rnEWsUQrLCQSi3vCt7gNO', // UserPassword123!
        role: 'USER'
      });

      await Task.bulkCreate([
        {
          title: 'Review System Security Audit',
          description: 'Verify rate limiting, CORS configuration, and JWT expirations.',
          status: 'IN_PROGRESS',
          priority: 'HIGH',
          userId: admin.id
        },
        {
          title: 'Database Indexing Optimization',
          description: 'Ensure email, userId, and status columns are indexed for high performance.',
          status: 'COMPLETED',
          priority: 'MEDIUM',
          userId: admin.id
        },
        {
          title: 'Frontend React UI Integration',
          description: 'Verify task status changes, role badge display, and logout flow.',
          status: 'PENDING',
          priority: 'LOW',
          userId: regular.id
        }
      ]);
      console.log('Demo accounts seeded: admin@taskshield.com and user@taskshield.com');
    }

    // 2. Connect to MongoDB via Mongoose for Activity Logging
    await connectMongoDB();

    // 3. Start Express HTTP Server
    app.listen(PORT, () => {
      console.log(`Express Backend running on http://localhost:${PORT}`);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    if (error.name === 'SequelizeConnectionRefusedError') {
      console.error('\n[HINT] Could not connect to MySQL. On Render, set your remote cloud MySQL URL/credentials in the Render Environment Variables tab.\n');
    } else if (error.name === 'SequelizeDatabaseError' && error.message.includes('command denied')) {
      console.error('\n[HINT] Permission denied creating table. Ensure your MYSQL_URL specifies a database where your user has permissions, e.g. /test (mysql://...:4000/test).\n');
    }
    process.exit(1);
  }
};

startServer();
