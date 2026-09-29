require('dotenv').config();
const { sequelize, User, Task } = require('./models');

/**
 * DATABASE SEEDER SCRIPT
 * Creates default ADMIN and REGULAR USER accounts with sample tasks.
 * Run via: node seed.js
 */

const seedDatabase = async () => {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    await sequelize.sync({ alter: false });

    console.log('Clearing existing test data...');
    await Task.destroy({ where: {} });
    await User.destroy({ where: {} });

    console.log('Creating demo users...');
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

    console.log('Creating sample tasks...');
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

    console.log('\n========================================');
    console.log(' DATABASE SEEDED SUCCESSFULLY! 🎉');
    console.log('========================================');
    console.log('ADMIN ACCOUNT:');
    console.log('  Email:    admin@taskshield.com');
    console.log('  Password: AdminPassword123!');
    console.log('  Role:     ADMIN\n');
    console.log('REGULAR USER ACCOUNT:');
    console.log('  Email:    user@taskshield.com');
    console.log('  Password: UserPassword123!');
    console.log('  Role:     USER');
    console.log('========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();
