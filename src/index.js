require('dotenv').config();
const sequelize = require('./db/config');
const { Op } = require('sequelize');
const User = require('./models/User');
const Product = require('./models/Product');
const { Order, OrderItem } = require('./models/Order');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { requestPayment, verifyPayment } = require('./services/zarinpal');
const bot = require('./bot');
const express = require('express');
const { handlePayment } = require('./handlers/payment');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'images');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

// Helper function to show main menu
async function showMainMenu(chatId, isAdmin) {
  const keyboard = {
    reply_markup: {
      keyboard: [
        ['🛍 مشاهده محصولات'],
        ['🛒 سفارشات من']
      ],
      resize_keyboard: true
    }
  };

  if (isAdmin) {
    keyboard.reply_markup.keyboard.push(['👑 پنل مدیریت']);
  }

  await bot.sendMessage(chatId, 'منوی اصلی:', keyboard);
}

// Helper function to format price in Toman
function formatPrice(price) {
  return Number(price).toLocaleString('fa-IR');
}

// Test database connection
sequelize.authenticate()
  .then(() => console.log('Connected to PostgreSQL'))
  .catch(err => console.error('PostgreSQL connection error:', err));

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
bot.onText(/👑 پنل مدیریت/, async (msg) => {
  if (msg.from.id.toString() !== process.env.ADMIN_USER_ID) return;

  const keyboard = {
    reply_markup: {
      keyboard: [
        ['➕ افزودن محصول', '📝 ویرایش محصول'],
        ['❌ حذف محصول', '📊 مشاهده سفارشات'],
        ['🔙 بازگشت به منوی اصلی']
      ],
      resize_keyboard: true
    }
  };

  bot.sendMessage(msg.chat.id, 'به پنل مدیریت خوش آمدید! لطفا یک گزینه را انتخاب کنید:', keyboard);
});

// Add Product Handler
bot.onText(/➕ افزودن محصول/, async (msg) => {
  if (msg.from.id.toString() !== process.env.ADMIN_USER_ID) return;

  userStates.set(msg.from.id, { state: 'ADDING_PRODUCT_NAME' });
  bot.sendMessage(msg.chat.id, 'لطفا نام محصول را وارد کنید:');
});

// Back to Main Menu Handler
bot.onText(/🔙 بازگشت به منوی اصلی/, async (msg) => {
  const user = await User.findOne({ where: { telegramId: msg.from.id } });
  await showMainMenu(msg.chat.id, user.isAdmin);
});

// View Products Handler
bot.onText(/🛍 مشاهده محصولات/, async (msg) => {
  try {
    const products = await Product.findAll({
      where: {
        availableUnits: {
          [Op.gt]: 0
        }
      }
    });
    
    if (products.length === 0) {
      return bot.sendMessage(msg.chat.id, 'در حال حاضر محصولی موجود نیست.');
    }

    for (const product of products) {
      // Escape special characters for Markdown
      const escapedName = product.name.replace(/[*_`]/g, '\\$&');
      const escapedDescription = product.description.replace(/[*_`]/g, '\\$&');
      
      const message = `*${escapedName}*
💬 توضیحات: ${escapedDescription}
💰 قیمت: ${formatPrice(product.price)} تومان
📦 موجودی: ${product.availableUnits} عدد

برای سفارش از دستور زیر استفاده کنید:
/order\\_${product.id}`;

      const imagePath = path.join(UPLOAD_DIR, product.imagePath);
      await bot.sendPhoto(msg.chat.id, fs.createReadStream(imagePath), {
        caption: message,
        parse_mode: 'Markdown'
      });
    }
  } catch (error) {
    console.error('Error in View Products:', error);
    bot.sendMessage(msg.chat.id, 'متأسفانه در دریافت لیست محصولات مشکلی پیش آمده است.');
  }
});

// Helper function to show product list for admin
async function showProductListForAdmin(chatId, action) {
  const products = await Product.findAll();
  
  if (products.length === 0) {
    return bot.sendMessage(chatId, 'هیچ محصولی موجود نیست.');
  }

  const keyboard = {
    reply_markup: {
      inline_keyboard: products.map(product => ([{
        text: product.name,
        callback_data: `${action}_${product.id}`
      }]))
    }
  };

  const actionTitles = {
    'edit': 'ویرایش',
    'delete': 'حذف'
  };

  await bot.sendMessage(
    chatId,
    `لطفا محصول مورد نظر برای ${actionTitles[action]} را انتخاب کنید:`,
    keyboard
  );
}

// Edit Product Handler
bot.onText(/📝 ویرایش محصول/, async (msg) => {
  if (msg.from.id.toString() !== process.env.ADMIN_USER_ID) return;
  await showProductListForAdmin(msg.chat.id, 'edit');
});

// Delete Product Handler
bot.onText(/❌ حذف محصول/, async (msg) => {
  if (msg.from.id.toString() !== process.env.ADMIN_USER_ID) return;
  await showProductListForAdmin(msg.chat.id, 'delete');
});

// View Orders Handler for Admin
bot.onText(/📊 مشاهده سفارشات/, async (msg) => {
  if (msg.from.id.toString() !== process.env.ADMIN_USER_ID) return;

  try {
    const orders = await Order.findAll({
      include: [{
        model: Product,
        through: { attributes: ['quantity'] }
      }, {
        model: User,
        attributes: ['firstName', 'lastName', 'username']
      }],
      order: [['createdAt', 'DESC']]
    });

    if (orders.length === 0) {
      return bot.sendMessage(msg.chat.id, 'هیچ سفارشی ثبت نشده است.');
    }

    for (const order of orders) {
      const customerName = order.User.firstName || order.User.username || 'کاربر ناشناس';
      let message = `📋 سفارش #${order.id}\n`;
      message += `👤 مشتری: ${customerName}\n`;
      message += `📅 تاریخ: ${new Date(order.createdAt).toLocaleDateString('fa-IR')}\n`;
      message += `🏷 وضعیت: ${translateStatus(order.status)}\n`;
      message += `💰 مبلغ کل: ${formatPrice(order.totalAmount)} تومان\n\n`;
      message += `📦 اقلام سفارش:\n`;
      
      for (const product of order.Products) {
        message += `- ${product.name} (${product.OrderItem.quantity} عدد)\n`;
      }

      await bot.sendMessage(msg.chat.id, message);
    }
  } catch (error) {
    console.error('Error fetching admin orders:', error);
    bot.sendMessage(msg.chat.id, 'متأسفانه در دریافت لیست سفارشات مشکلی پیش آمده است.');
  }
});

// Helper function to translate order status
function translateStatus(status) {
  const statusTranslations = {
    'pending': 'در انتظار تایید',
    'confirmed': 'تایید شده',
    'cancelled': 'لغو شده'
  };
  return statusTranslations[status] || status;
}

// Handle callback queries for edit and delete actions
bot.on('callback_query', async (query) => {
  const [action, id] = query.data.split('_');
  const chatId = query.message.chat.id;

  if (action === 'edit') {
    const product = await Product.findByPk(id);
    if (!product) {
      return bot.sendMessage(chatId, 'محصول مورد نظر یافت نشد.');
    }

    userStates.set(query.from.id, {
      state: 'EDITING_PRODUCT_NAME',
      productId: id,
      currentProduct: product
    });

    const message = `مشخصات فعلی محصول:\n\nنام: ${product.name}\nتوضیحات: ${product.description}\nقیمت: ${formatPrice(product.price)} تومان\nموجودی: ${product.availableUnits} عدد\n\nلطفا نام جدید محصول را وارد کنید (یا برای لغو از دستور /cancel استفاده کنید):`;
    await bot.sendMessage(chatId, message);
  } else if (action === 'delete') {
    const product = await Product.findByPk(id);
    if (!product) {
      return bot.sendMessage(chatId, 'محصول مورد نظر یافت نشد.');
    }

    try {
      const imagePath = path.join(UPLOAD_DIR, product.imagePath);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }

      await product.destroy();
      await bot.sendMessage(chatId, 'محصول با موفقیت حذف شد.');
    } catch (error) {
      console.error('Error deleting product:', error);
      await bot.sendMessage(chatId, 'متأسفانه در حذف محصول مشکلی پیش آمده است.');
    }
  } else if (action === 'pay') {
    await handlePayment(chatId, id);
  }

  await bot.answerCallbackQuery(query.id);
});

// Cancel command handler
bot.onText(/\/cancel/, async (msg) => {
  const userId = msg.from.id;
  if (userStates.has(userId)) {
    userStates.delete(userId);
    await bot.sendMessage(msg.chat.id, 'عملیات لغو شد.');
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
    bot.sendMessage(msg.chat.id, 'لطفا توضیحات محصول را وارد کنید:');
  } else if (userState.state === 'ADDING_PRODUCT_DESCRIPTION') {
    userState.productDescription = msg.text;
    userState.state = 'ADDING_PRODUCT_PRICE';
    bot.sendMessage(msg.chat.id, 'لطفا قیمت محصول را به تومان وارد کنید (فقط عدد):');
  } else if (userState.state === 'ADDING_PRODUCT_PRICE') {
    const price = parseFloat(msg.text);
    if (isNaN(price)) {
      return bot.sendMessage(msg.chat.id, 'لطفا یک عدد معتبر وارد کنید:');
    }
    userState.productPrice = price;
    userState.state = 'ADDING_PRODUCT_UNITS';
    bot.sendMessage(msg.chat.id, 'لطفا تعداد موجودی را وارد کنید (فقط عدد):');
  } else if (userState.state === 'ADDING_PRODUCT_UNITS') {
    const units = parseInt(msg.text);
    if (isNaN(units)) {
      return bot.sendMessage(msg.chat.id, 'لطفا یک عدد معتبر وارد کنید:');
    }
    userState.productUnits = units;
    userState.state = 'ADDING_PRODUCT_IMAGE';
    bot.sendMessage(msg.chat.id, 'لطفا تصویر محصول را ارسال کنید:');
  } else if (userState.state === 'ADDING_PRODUCT_IMAGE') {
    try {
      if (!msg.photo) {
        return bot.sendMessage(msg.chat.id, 'لطفا یک تصویر ارسال کنید:');
      }

      const photo = msg.photo[msg.photo.length - 1];
      const imagePath = await downloadImage(photo.file_id);

      await Product.create({
        name: userState.productName,
        description: userState.productDescription,
        price: userState.productPrice,
        availableUnits: userState.productUnits,
        imagePath: imagePath
      });

      bot.sendMessage(msg.chat.id, 'محصول با موفقیت اضافه شد.');
      userStates.delete(userId);
    } catch (error) {
      console.error('Error saving product:', error);
      bot.sendMessage(msg.chat.id, 'متأسفانه در ذخیره محصول مشکلی پیش آمده است.');
    }
  } else if (userState.state === 'ORDERING') {
    try {
      const quantity = parseInt(msg.text);
      if (isNaN(quantity) || quantity < 1) {
        return bot.sendMessage(msg.chat.id, 'لطفا یک عدد معتبر بزرگتر از صفر وارد کنید.');
      }

      const product = await Product.findByPk(userState.productId);
      if (!product || product.availableUnits < quantity) {
        return bot.sendMessage(msg.chat.id, 'متأسفانه این تعداد از محصول موجود نیست.');
      }

      const user = await User.findOne({ where: { telegramId: userId } });
      const order = await Order.create({
        UserId: user.id,
        totalAmount: product.price * quantity,
        status: 'pending',
        paymentStatus: 'not_paid'
      });

      await OrderItem.create({
        OrderId: order.id,
        ProductId: product.id,
        quantity: quantity
      });

      await product.update({
        availableUnits: product.availableUnits - quantity
      });

      // Send order confirmation and payment button
      const message = `✅ سفارش شما با موفقیت ثبت شد!\n`
        + `شماره سفارش: ${order.id}\n`
        + `محصول: ${product.name}\n`
        + `تعداد: ${quantity} عدد\n`
        + `مبلغ کل: ${formatPrice(order.totalAmount)} تومان\n\n`
        + `لطفا برای پرداخت و تکمیل سفارش، بر روی دکمه پرداخت کلیک کنید.`;

      await bot.sendMessage(msg.chat.id, message, {
        reply_markup: {
          inline_keyboard: [
            [{ text: '💳 پرداخت سفارش', callback_data: `pay_${order.id}` }]
          ]
        }
      });

      userStates.delete(userId);
    } catch (error) {
      console.error('Error processing order:', error);
      bot.sendMessage(msg.chat.id, 'متأسفانه در ثبت سفارش مشکلی پیش آمده است.');
    }
  } else if (userState.state === 'EDITING_PRODUCT_NAME') {
    userState.newName = msg.text;
    userState.state = 'EDITING_PRODUCT_DESCRIPTION';
    bot.sendMessage(msg.chat.id, 'لطفا توضیحات جدید محصول را وارد کنید:');
  } else if (userState.state === 'EDITING_PRODUCT_DESCRIPTION') {
    userState.newDescription = msg.text;
    userState.state = 'EDITING_PRODUCT_PRICE';
    bot.sendMessage(msg.chat.id, 'لطفا قیمت جدید محصول را به تومان وارد کنید (فقط عدد):');
  } else if (userState.state === 'EDITING_PRODUCT_PRICE') {
    const price = parseFloat(msg.text);
    if (isNaN(price)) {
      return bot.sendMessage(msg.chat.id, 'لطفا یک عدد معتبر وارد کنید:');
    }
    userState.newPrice = price;
    userState.state = 'EDITING_PRODUCT_UNITS';
    bot.sendMessage(msg.chat.id, 'لطفا تعداد موجودی جدید را وارد کنید (فقط عدد):');
  } else if (userState.state === 'EDITING_PRODUCT_UNITS') {
    const units = parseInt(msg.text);
    if (isNaN(units)) {
      return bot.sendMessage(msg.chat.id, 'لطفا یک عدد معتبر وارد کنید:');
    }
    userState.newUnits = units;
    userState.state = 'EDITING_PRODUCT_IMAGE';
    bot.sendMessage(msg.chat.id, 'لطفا تصویر جدید محصول را ارسال کنید (یا برای حفظ تصویر فعلی از دستور /skip استفاده کنید):');
  } else if (userState.state === 'EDITING_PRODUCT_IMAGE') {
    try {
      let imagePath = userState.currentProduct.imagePath;

      if (msg.text !== '/skip') {
        if (!msg.photo) {
          return bot.sendMessage(msg.chat.id, 'لطفا یک تصویر ارسال کنید یا برای حفظ تصویر فعلی از دستور /skip استفاده کنید:');
        }

        const oldImagePath = path.join(UPLOAD_DIR, userState.currentProduct.imagePath);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }

        const photo = msg.photo[msg.photo.length - 1];
        imagePath = await downloadImage(photo.file_id);
      }

      await Product.update({
        name: userState.newName,
        description: userState.newDescription,
        price: userState.newPrice,
        availableUnits: userState.newUnits,
        imagePath: imagePath
      }, {
        where: { id: userState.productId }
      });

      bot.sendMessage(msg.chat.id, 'محصول با موفقیت بروزرسانی شد.');
      userStates.delete(userId);
    } catch (error) {
      console.error('Error updating product:', error);
      bot.sendMessage(msg.chat.id, 'متأسفانه در بروزرسانی محصول مشکلی پیش آمده است.');
    }
  }
});

// Order command handler
bot.onText(/\/order_(.+)/, async (msg, match) => {
  try {
    const productId = match[1];
    const product = await Product.findByPk(productId);
    
    if (!product || product.availableUnits === 0) {
      return bot.sendMessage(msg.chat.id, 'متأسفانه این محصول در حال حاضر موجود نیست.');
    }

    userStates.set(msg.from.id, {
      state: 'ORDERING',
      productId: productId
    });

    bot.sendMessage(msg.chat.id, `چه تعداد از محصول ${product.name} می‌خواهید سفارش دهید؟`);
  } catch (error) {
    console.error('Error in order command:', error);
    bot.sendMessage(msg.chat.id, 'متأسفانه در ثبت سفارش مشکلی پیش آمده است.');
  }
});

// View Orders Handler
bot.onText(/🛒 سفارشات من/, async (msg) => {
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
      return bot.sendMessage(msg.chat.id, 'شما هنوز سفارشی ثبت نکرده‌اید.');
    }

    for (const order of orders) {
      let message = `🛍 سفارش #${order.id}\n`;
      message += `📅 تاریخ: ${new Date(order.createdAt).toLocaleDateString('fa-IR')}\n`;
      message += `🏷 وضعیت: ${translateStatus(order.status)}\n`;
      message += `💰 مبلغ کل: ${formatPrice(order.totalAmount)} تومان\n\n`;
      message += `📦 اقلام سفارش:\n`;
      
      for (const product of order.Products) {
        message += `- ${product.name} (${product.OrderItem.quantity} عدد)\n`;
      }

      await bot.sendMessage(msg.chat.id, message);
    }
  } catch (error) {
    console.error('Error fetching orders:', error);
    bot.sendMessage(msg.chat.id, 'متأسفانه در دریافت لیست سفارشات مشکلی پیش آمده است.');
  }
});

// Payment verification endpoint
app.get('/verify', async (req, res) => {
  try {
    const { Authority, Status, order_id } = req.query;

    if (Status === 'OK') {
      const order = await Order.findByPk(order_id, {
        include: [{ model: User }]
      });
      
      if (!order) {
        return res.send('سفارش مورد نظر یافت نشد.');
      }

      if (order.paymentStatus === 'paid') {
        return res.send('این سفارش قبلا پرداخت شده است.');
      }

      // Verify payment with Zarinpal
      const verification = await verifyPayment(Authority, Math.round(order.totalAmount));

      if (verification.success) {
        // Update order status
        await order.update({
          status: 'confirmed',
          paymentStatus: 'paid',
          refId: verification.refId
        });

        // Send confirmation message to user
        const message = `✅ پرداخت شما با موفقیت انجام شد\n`
          + `شماره سفارش: ${order.id}\n`
          + `کد پیگیری: ${verification.refId}\n`
          + `مبلغ: ${formatPrice(order.totalAmount)} تومان`;

        await bot.sendMessage(order.User.telegramId, message);

        return res.send('پرداخت با موفقیت انجام شد. می‌توانید به ربات بازگردید.');
      } else {
        await order.update({
          paymentStatus: 'failed'
        });

        await bot.sendMessage(
          order.User.telegramId, 
          `❌ پرداخت سفارش #${order.id} ناموفق بود.\n${verification.message}`
        );

        return res.send('پرداخت ناموفق بود. می‌توانید به ربات بازگردید و مجددا تلاش کنید.');
      }
    } else {
      const order = await Order.findByPk(order_id, {
        include: [{ model: User }]
      });
      if (order) {
        await order.update({
          paymentStatus: 'failed'
        });

        await bot.sendMessage(
          order.User.telegramId,
          `❌ پرداخت سفارش #${order.id} انجام نشد.`
        );
      }

      return res.send('پرداخت انجام نشد. می‌توانید به ربات بازگردید و مجددا تلاش کنید.');
    }
  } catch (error) {
    console.error('Error in payment verification:', error);
    res.status(500).send('خطا در تایید پرداخت. لطفا با پشتیبانی تماس بگیرید.');
  }
});

// Start Express server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log('Bot is running...');
}); 