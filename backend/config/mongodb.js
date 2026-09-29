const dns = require('dns');
const mongoose = require('mongoose');
require('dotenv').config();

// Configure DNS resolution for MongoDB Atlas SRV lookups (resolves querySrv ENOTFOUND/IPv6 issues)
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (err) {
  console.warn('Could not set custom DNS servers:', err.message);
}

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
