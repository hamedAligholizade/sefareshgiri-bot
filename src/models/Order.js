const { DataTypes } = require('sequelize');
const sequelize = require('../db/config');
const User = require('./User');
const Product = require('./Product');

const Order = sequelize.define('Order', {
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'cancelled', 'awaiting_payment', 'paid'),
    defaultValue: 'pending'
  },
  paymentStatus: {
    type: DataTypes.ENUM('not_paid', 'awaiting_verification', 'paid', 'failed'),
    defaultValue: 'not_paid'
  },
  authorityCode: {
    type: DataTypes.STRING,
    allowNull: true
  },
  refId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});

const OrderItem = sequelize.define('OrderItem', {
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    }
  }
});

// Define relationships
Order.belongsTo(User);
User.hasMany(Order);

Order.belongsToMany(Product, { through: OrderItem });
Product.belongsToMany(Order, { through: OrderItem });

module.exports = { Order, OrderItem }; 