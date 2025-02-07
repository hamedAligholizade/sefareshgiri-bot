require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const sequelize = require('./db/config');
const { Op } = require('sequelize');
const User = require('./models/User');
const Product = require('./models/Product');
const { Order, OrderItem } = require('./models/Order');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'images');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Helper function to show main menu
async function showMainMenu(chatId, isAdmin) {
  const keyboard = {
    reply_markup: {
      keyboard: [
        ['🛍 View Products'],
        ['🛒 My Orders']
      ],
      resize_keyboard: true
    }
  };

  if (isAdmin) {
    keyboard.reply_markup.keyboard.push(['👑 Admin Panel']);
  }

  await bot.sendMessage(chatId, 'Main Menu:', keyboard);
}

// Test database connection
sequelize.authenticate()
  .then(() => console.log('Connected to PostgreSQL'))
  .catch(err => console.error('PostgreSQL connection error:', err));

// Create bot instance
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// Store user states
const userStates = new Map();

// Helper function to download and save image
async function downloadImage(fileId) {
  try {
    // Get file path from Telegram
    const file = await bot.getFile(fileId);
    const filePath = file.file_path;

    // Generate unique filename
    const fileExt = path.extname(filePath);
    const fileName = `${uuidv4()}${fileExt}`;
    const localPath = path.join(UPLOAD_DIR, fileName);

    // Download file
    const response = await axios({
      method: 'GET',
      url: `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${filePath}`,
      responseType: 'stream'
    });

    // Save file
    const writer = fs.createWriteStream(localPath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => resolve(fileName));
      writer.on('error', reject);
    });
  } catch (error) {
    console.error('Error downloading image:', error);
    throw error;
  }
}

// Command handlers
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    const [user] = await User.findOrCreate({
      where: { telegramId: msg.from.id },
      defaults: {
        firstName: msg.from.first_name,
        lastName: msg.from.last_name,
        username: msg.from.username,
        isAdmin: msg.from.id.toString() === process.env.ADMIN_USER_ID
      }
    });

    await showMainMenu(chatId, user.isAdmin);
  } catch (error) {
    console.error('Error in /start command:', error);
    bot.sendMessage(chatId, 'Sorry, there was an error processing your request.');
  }
});

// Admin commands
bot.onText(/👑 Admin Panel/, async (msg) => {
  if (msg.from.id.toString() !== process.env.ADMIN_USER_ID) return;

  const keyboard = {
    reply_markup: {
      keyboard: [
        ['➕ Add Product', '📝 Edit Product'],
        ['❌ Delete Product', '📊 View Orders'],
        ['🔙 Back to Main Menu']
      ],
      resize_keyboard: true
    }
  };

  bot.sendMessage(msg.chat.id, 'Welcome to Admin Panel! Choose an option:', keyboard);
});

// Add Product Handler
bot.onText(/➕ Add Product/, async (msg) => {
  if (msg.from.id.toString() !== process.env.ADMIN_USER_ID) return;

  userStates.set(msg.from.id, { state: 'ADDING_PRODUCT_NAME' });
  bot.sendMessage(msg.chat.id, 'Please send the product name:');
});

// Back to Main Menu Handler
bot.onText(/🔙 Back to Main Menu/, async (msg) => {
  const user = await User.findOne({ where: { telegramId: msg.from.id } });
  await showMainMenu(msg.chat.id, user.isAdmin);
});

// View Products Handler
bot.onText(/🛍 View Products/, async (msg) => {
  try {
    const products = await Product.findAll({
      where: {
        availableUnits: {
          [Op.gt]: 0
        }
      }
    });
    
    if (products.length === 0) {
      return bot.sendMessage(msg.chat.id, 'No products available at the moment.');
    }

    for (const product of products) {
      // Escape special characters for Markdown
      const escapedName = product.name.replace(/[*_`]/g, '\\$&');
      const escapedDescription = product.description.replace(/[*_`]/g, '\\$&');
      
      // Format price with 2 decimal places
      const formattedPrice = Number(product.price).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
      
      const message = `*${escapedName}*
💬 Description: ${escapedDescription}
💰 Price: $${formattedPrice}
📦 Available Units: ${product.availableUnits}

To order, use command: /order\\_${product.id}`;

      const imagePath = path.join(UPLOAD_DIR, product.imagePath);
      await bot.sendPhoto(msg.chat.id, fs.createReadStream(imagePath), {
        caption: message,
        parse_mode: 'Markdown'
      });
    }
  } catch (error) {
    console.error('Error in View Products:', error);
    bot.sendMessage(msg.chat.id, 'Sorry, there was an error fetching the products.');
  }
});

// Handle all other messages
bot.on('message', async (msg) => {
  const userId = msg.from.id;
  const userState = userStates.get(userId);

  if (!userState) return;

  if (userState.state === 'ADDING_PRODUCT_NAME') {
    userState.productName = msg.text;
    userState.state = 'ADDING_PRODUCT_DESCRIPTION';
    bot.sendMessage(msg.chat.id, 'Please send the product description:');
  } else if (userState.state === 'ADDING_PRODUCT_DESCRIPTION') {
    userState.productDescription = msg.text;
    userState.state = 'ADDING_PRODUCT_PRICE';
    bot.sendMessage(msg.chat.id, 'Please send the product price (number only):');
  } else if (userState.state === 'ADDING_PRODUCT_PRICE') {
    const price = parseFloat(msg.text);
    if (isNaN(price)) {
      return bot.sendMessage(msg.chat.id, 'Please send a valid number for the price:');
    }
    userState.productPrice = price;
    userState.state = 'ADDING_PRODUCT_UNITS';
    bot.sendMessage(msg.chat.id, 'Please send the available units (number only):');
  } else if (userState.state === 'ADDING_PRODUCT_UNITS') {
    const units = parseInt(msg.text);
    if (isNaN(units)) {
      return bot.sendMessage(msg.chat.id, 'Please send a valid number for available units:');
    }
    userState.productUnits = units;
    userState.state = 'ADDING_PRODUCT_IMAGE';
    bot.sendMessage(msg.chat.id, 'Please send the product image:');
  } else if (userState.state === 'ADDING_PRODUCT_IMAGE') {
    try {
      if (!msg.photo) {
        return bot.sendMessage(msg.chat.id, 'Please send an image file:');
      }

      // Get the highest resolution photo
      const photo = msg.photo[msg.photo.length - 1];
      const imagePath = await downloadImage(photo.file_id);

      await Product.create({
        name: userState.productName,
        description: userState.productDescription,
        price: userState.productPrice,
        availableUnits: userState.productUnits,
        imagePath: imagePath
      });

      bot.sendMessage(msg.chat.id, 'Product added successfully!');
      userStates.delete(userId);
    } catch (error) {
      console.error('Error saving product:', error);
      bot.sendMessage(msg.chat.id, 'Sorry, there was an error saving the product.');
    }
  } else if (userState.state === 'ORDERING') {
    try {
      const quantity = parseInt(msg.text);
      if (isNaN(quantity) || quantity < 1) {
        return bot.sendMessage(msg.chat.id, 'Please send a valid number greater than 0.');
      }

      const product = await Product.findByPk(userState.productId);
      if (!product || product.availableUnits < quantity) {
        return bot.sendMessage(msg.chat.id, 'Sorry, this quantity is not available.');
      }

      const user = await User.findOne({ where: { telegramId: userId } });
      const order = await Order.create({
        UserId: user.id,
        totalAmount: product.price * quantity
      });

      await OrderItem.create({
        OrderId: order.id,
        ProductId: product.id,
        quantity: quantity
      });

      // Update product quantity
      await product.update({
        availableUnits: product.availableUnits - quantity
      });

      bot.sendMessage(msg.chat.id, `Order placed successfully! Order ID: ${order.id}`);
      userStates.delete(userId);
    } catch (error) {
      console.error('Error processing order:', error);
      bot.sendMessage(msg.chat.id, 'Sorry, there was an error processing your order.');
    }
  }
});

// Order command handler
bot.onText(/\/order_(.+)/, async (msg, match) => {
  try {
    const productId = match[1];
    const product = await Product.findByPk(productId);
    
    if (!product || product.availableUnits === 0) {
      return bot.sendMessage(msg.chat.id, 'Sorry, this product is not available.');
    }

    userStates.set(msg.from.id, {
      state: 'ORDERING',
      productId: productId
    });

    bot.sendMessage(msg.chat.id, `How many units of ${product.name} would you like to order?`);
  } catch (error) {
    console.error('Error in order command:', error);
    bot.sendMessage(msg.chat.id, 'Sorry, there was an error processing your order.');
  }
});

// View Orders Handler
bot.onText(/🛒 My Orders/, async (msg) => {
  try {
    const user = await User.findOne({ where: { telegramId: msg.from.id } });
    const orders = await Order.findAll({
      where: { UserId: user.id },
      include: [{
        model: Product,
        through: { attributes: ['quantity'] }
      }],
      order: [['createdAt', 'DESC']]
    });

    if (orders.length === 0) {
      return bot.sendMessage(msg.chat.id, 'You have no orders yet.');
    }

    for (const order of orders) {
      let message = `Order #${order.id}\nStatus: ${order.status}\nTotal Amount: $${order.totalAmount}\n\nItems:\n`;
      for (const product of order.Products) {
        message += `- ${product.name} (${product.OrderItem.quantity} units)\n`;
      }
      message += `\nOrdered on: ${order.createdAt.toLocaleDateString()}`;
      await bot.sendMessage(msg.chat.id, message);
    }
  } catch (error) {
    console.error('Error fetching orders:', error);
    bot.sendMessage(msg.chat.id, 'Sorry, there was an error fetching your orders.');
  }
});

console.log('Bot is running...'); 