# Sefareshgiri Telegram Bot

A Telegram bot for managing product orders with admin panel and user interface.

## Features

- User Management
  - Automatically saves new users when they start the bot
  - Distinguishes between admin and regular users

- Product Management (Admin)
  - Create products with name, description, price, and image
  - Edit existing products
  - Delete products
  - View all orders

- User Features
  - View available products
  - Place orders
  - View order history

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
Create a `.env` file with the following variables:
```
BOT_TOKEN=your_telegram_bot_token
MONGODB_URI=mongodb://localhost:27017/sefareshgiri
ADMIN_USER_ID=your_telegram_user_id
```

3. Get your Telegram Bot Token:
- Talk to [@BotFather](https://t.me/botfather) on Telegram
- Create a new bot using the `/newbot` command
- Copy the token provided by BotFather

4. Get your Telegram User ID:
- Talk to [@userinfobot](https://t.me/userinfobot) on Telegram
- It will show you your Telegram User ID
- Use this ID as the `ADMIN_USER_ID` in your `.env` file

5. Start MongoDB:
Make sure MongoDB is installed and running on your system.

6. Run the bot:
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

## Usage

### Admin Commands
- Access admin panel using the "👑 Admin Panel" button
- Add products using "➕ Add Product"
- Edit products using "📝 Edit Product"
- Delete products using "❌ Delete Product"
- View orders using "📊 View Orders"

### User Commands
- View available products using "🛍 View Products"
- Place orders by selecting products
- View order history using "🛒 My Orders"

## License

MIT 