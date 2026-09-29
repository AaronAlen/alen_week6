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

    // Ensure Demo Admin Account always exists
    const adminEmail = 'admin@taskshield.com';
    let admin = await User.findOne({ where: { email: adminEmail } });
    if (!admin) {
      console.log('Creating demo admin account (admin@taskshield.com)...');
      admin = await User.create({
        name: 'Admin User',
        email: adminEmail,
        password: '$2b$10$n0XDqdOWA6qnN0jvEzul1ecoNtSS2jOTDbFNNq7zG//ZF0DxUxnU.', // AdminPassword123!
        role: 'ADMIN'
      });
      console.log('Demo admin created.');
    } else if (admin.role !== 'ADMIN') {
      admin.role = 'ADMIN';
      await admin.save();
    }

    // Ensure Demo Regular User Account exists
    const userEmail = 'user@taskshield.com';
    let regular = await User.findOne({ where: { email: userEmail } });
    if (!regular) {
      console.log('Creating demo regular user account (user@taskshield.com)...');
      regular = await User.create({
        name: 'Regular User',
        email: userEmail,
        password: '$2b$10$8Q6.cOS2QO.pBLC2IrIiB.D8GxXLaa84rnEWsUQrLCQSi3vCt7gNO', // UserPassword123!
        role: 'USER'
      });
      console.log('Demo regular user created.');
    }

    // Seed sample tasks if no tasks exist
    const taskCount = await Task.count();
    if (taskCount === 0 && admin && regular) {
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
      console.log('Sample demo tasks created.');
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
