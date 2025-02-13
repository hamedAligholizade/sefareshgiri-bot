require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

// Create bot instance
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// Handle callback queries
bot.on('callback_query', async (query) => {
  const [action, id] = query.data.split('_');
  const chatId = query.message.chat.id;

  if (action === 'pay') {
    // We'll import the handler from a separate file
    const { handlePayment } = require('./handlers/payment');
    await handlePayment(chatId, id);
  }

  await bot.answerCallbackQuery(query.id);
});

module.exports = bot; 