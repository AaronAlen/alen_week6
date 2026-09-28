require('dotenv').config();
const app = require('./app');
const { sequelize } = require('./models');
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
