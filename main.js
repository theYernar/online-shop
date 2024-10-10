const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');
const dotenv = require('dotenv');

dotenv.config();
const app = express();
const port = 8888;

// Инициализация базы данных
const db = new sqlite3.Database('./onlineShopDB.sqlite', (err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log('Connected to the SQLite database.');
});

// Создание таблицы при запуске
db.run(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    images TEXT
  )
`);

// Настройки multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage }).array('images');

// Настройки для EJS
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // Для обработки JSON
app.use(express.static('public'));

// Главная страница
app.get('/', (req, res) => {
  db.all('SELECT * FROM products', [], (err, products) => {
    if (err) throw err;
    res.render('index', { products });
  });
});

// Админ страница
app.get('/users', (req, res) => {
  db.all('SELECT * FROM products', [], (err, products) => {
    if (err) throw err;
    res.render('index-for-users', { products });
  });
});

// Добавление товара
app.post('/add-product', (req, res, next) => {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) return res.status(500).json({ message: 'Ошибка загрузки файлов' });
    if (err) return res.status(500).json({ message: 'Неизвестная ошибка' });

    const { name, price } = req.body;
    const images = req.files.map(file => `/uploads/${file.filename}`).join(',');

    const query = `INSERT INTO products (name, price, images) VALUES (?, ?, ?)`;
    db.run(query, [name, price, images], (err) => {
      if (err) return console.error(err.message);
      res.redirect('/');
    });
  });
});

// Удаление товара
app.post('/delete-product/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM products WHERE id = ?', id, (err) => {
    if (err) return console.error(err.message);
    res.redirect('/');
  });
});

// Telegram Bot
const TOKEN = process.env.KEY;
const URL = process.env.URL_FOR_USERS;
const URL_ADMINS = process.env.URL_FOR_ADMINS;
const bot = new TelegramBot(TOKEN, { polling: true });

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const keyboard = {
    inline_keyboard: [
      [{ text: 'Открыть Магазин для юзера', web_app: { url: URL } }, { text: 'Открыть Магазин для админа', web_app: { url: URL_ADMINS } }]
    ]
  };
  bot.sendMessage(chatId, 'Добро пожаловать в наш магазин!', { reply_markup: keyboard });
});

// Отправка корзины через Telegram
app.post('/send-cart', async (req, res) => {
  const cart = req.body.cart;
  const chatId = req.body.chatId;

  if (!cart || cart.length === 0) {
    return res.status(400).json({ success: false, message: 'Корзина пуста' });
  }

  const cartMessage = cart.map(item => `${item.name} - ${item.price}`).join('\n');

  try {
    await bot.sendMessage(chatId, `Ваш заказ:\n${cartMessage}`);
    res.json({ success: true });
  } catch (error) {
    console.error('Ошибка при отправке сообщения в Telegram:', error.response?.body || error);
    res.json({ success: false, message: 'Ошибка при отправке сообщения в Telegram' });
  }
});

// Запуск сервера
app.listen(port, () => {
  console.log("Сервер запущен на http://localhost:${port}");
});
