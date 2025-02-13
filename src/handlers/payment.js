const { Order, OrderItem } = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const { requestPayment } = require('../services/zarinpal');
const bot = require('../bot');

// Helper function to format price
function formatPrice(price) {
  return Number(price).toLocaleString('fa-IR');
}

// Handle payment for order
async function handlePayment(chatId, orderId) {
  try {
    console.log(`Processing payment for order ${orderId}`);
    const order = await Order.findByPk(orderId, {
      include: [
        {
          model: Product,
          through: { attributes: ['quantity'] }
        },
        {
          model: User
        }
      ]
    });

    if (!order) {
      console.log(`Order ${orderId} not found`);
      return bot.sendMessage(chatId, 'سفارش مورد نظر یافت نشد.');
    }

    // Create payment description
    let description = `پرداخت سفارش #${order.id}\n`;
    for (const product of order.Products) {
      description += `${product.name} (${product.OrderItem.quantity} عدد)\n`;
    }

    console.log(`Requesting payment for order ${orderId}`);
    // Request payment from Zarinpal
    const payment = await requestPayment(
      Math.round(order.totalAmount), // Convert to Toman and round
      description,
      order.id
    );

    console.log(`Payment request successful, authority: ${payment.authority}`);
    // Update order status
    await order.update({
      status: 'awaiting_payment',
      paymentStatus: 'awaiting_verification',
      authorityCode: payment.authority
    });

    // Send payment link to user
    const message = `لطفا برای پرداخت مبلغ ${formatPrice(order.totalAmount)} تومان بر روی لینک زیر کلیک کنید:`;
    await bot.sendMessage(chatId, message, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔗 پرداخت آنلاین', url: payment.url }]
        ]
      }
    });

  } catch (error) {
    console.error('Error in payment handler:', error);
    bot.sendMessage(chatId, 'متأسفانه در ایجاد لینک پرداخت مشکلی پیش آمده است.');
  }
}

module.exports = {
  handlePayment
}; 