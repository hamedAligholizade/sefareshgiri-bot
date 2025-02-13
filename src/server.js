const express = require('express');
const { Order } = require('./models/Order');
const { verifyPayment } = require('./services/zarinpal');
const bot = require('./bot');

const app = express();
const port = process.env.PORT || 3000;

// Helper function to format price
function formatPrice(price) {
  return Number(price).toLocaleString('fa-IR');
}

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

app.listen(port, () => {
  console.log(`Payment verification server is running on port ${port}`);
}); 