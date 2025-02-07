require('dotenv').config();
const sequelize = require('./config');
const User = require('../models/User');
const Product = require('../models/Product');
const { Order, OrderItem } = require('../models/Order');

async function migrate() {
  try {
    // Drop all tables and recreate them
    await sequelize.sync({ force: true });
    console.log('Database synchronized successfully');

    // Create admin user if ADMIN_USER_ID is provided
    if (process.env.ADMIN_USER_ID) {
      await User.create({
        telegramId: parseInt(process.env.ADMIN_USER_ID),
        isAdmin: true,
        firstName: 'Admin'
      });
      console.log('Admin user created successfully');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error synchronizing database:', error);
    process.exit(1);
  }
}

migrate(); 