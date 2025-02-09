require('dotenv').config();
const sequelize = require('./config');
const User = require('../models/User');
const Product = require('../models/Product');
const { Order, OrderItem } = require('../models/Order');

async function migrate() {
  try {
    // Sync database without dropping existing tables
    await sequelize.sync({ alter: true });
    console.log('Database synchronized successfully');

    // Create admin user if it doesn't exist
    if (process.env.ADMIN_USER_ID) {
      await User.findOrCreate({
        where: { telegramId: parseInt(process.env.ADMIN_USER_ID) },
        defaults: {
          isAdmin: true,
          firstName: 'Admin'
        }
      });
      console.log('Admin user checked/created successfully');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error synchronizing database:', error);
    process.exit(1);
  }
}

migrate(); 