const mongoose = require('mongoose');
require('dotenv').config();

/**
 * MONGODB CONNECTION SETUP (MONGOOSE)
 * 
 * We use MongoDB specifically for flexible, append-only activity/audit logs.
 * Mongoose handles connection management and provides document schema validation.
 */

const connectMongoDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/week6_task_manager_logs';
    await mongoose.connect(mongoURI);
    console.log('MongoDB connected successfully for Activity Logging.');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    // Don't crash app if MongoDB is down, but log warning
  }
};

module.exports = connectMongoDB;
