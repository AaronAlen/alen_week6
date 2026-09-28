require('dotenv').config();
const app = require('./app');
const { sequelize } = require('./models');
const connectMongoDB = require('./config/mongodb');


const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // 1. Connect and Sync MySQL Database via Sequelize
    await sequelize.authenticate();
    console.log('MySQL Database connected successfully.');
    
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
    process.exit(1);
  }
};

startServer();
