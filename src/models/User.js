const { DataTypes } = require('sequelize');
const sequelize = require('../db/config');

const User = sequelize.define('User', {
  telegramId: {
    type: DataTypes.BIGINT,
    allowNull: false,
    unique: true
  },
  firstName: {
    type: DataTypes.STRING
  },
  lastName: {
    type: DataTypes.STRING
  },
  username: {
    type: DataTypes.STRING
  },
  isAdmin: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});

module.exports = User; 