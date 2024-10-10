const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api'); // Telegram Bot API
const dotenv = require('dotenv');

dotenv.config();
const app = express();
const port = 8888;

// Инициализация базы данных SQLite
const db = new sqlite3.Database('./onlineShopDB.sqlite', (err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log('Connected to the SQLite database.');
});

// Создание таблицы "products" при запуске приложения
db.run(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    images TEXT
  )
`);

// Настройки хранилища multer
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
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Главная страница для пользователей
app.get('/', (req, res) => {
  db.all('SELECT * FROM products', [], (err, products) => {
    if (err) {
      throw err;
    }
    res.render('index', { products });
  });
});

// Страница для админов
app.get('/users', (req, res) => {
  db.all('SELECT * FROM products', [], (err, products) => {
    if (err) {
      throw err;
    }
    res.render('index-for-users', { products });
  });
});

// Добавление товара
app.post('/add-product', upload, (req, res) => {
  const { name, price } = req.body;
  const images = req.files.map(file => `/uploads/${file.filename}`).join(',');

  const query = `INSERT INTO products (name, price, images) VALUES (?, ?, ?)`;
  db.run(query, [name, price, images], (err) => {
    if (err) {
      return console.error(err.message);
    }
    res.redirect('/');
  });
});

// Удаление товара
app.post('/delete-product/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM products WHERE id = ?', id, (err) => {
    if (err) {
      return console.error(err.message);
    }
    res.redirect('/');
  });
});

// === Telegram Bot Integration ===
const TOKEN = process.env.KEY;
const URL = process.env.URL_FOR_USERS;
const URL_ADMINS = process.env.URL_FOR_ADMINS;
const bot = new TelegramBot(TOKEN, { polling: true });

// Обработчик команды /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const keyboard = {
    inline_keyboard: [
      [
        { text: 'Открыть Магазин для юзера', web_app: { url: URL } },
        { text: 'Открыть Магазин для админа', web_app: { url: URL_ADMINS } }
      ]
    ]
  };

  bot.sendMessage(chatId, 'Добро пожаловать в наш магазин!', { reply_markup: keyboard });
});

// Маршрут для отправки корзины через Telegram
app.post('/send-cart', (req, res) => {
    const cart = req.body.cart;
    const chatId = req.body.chatId; // Получаем chatId из запроса

    const cartMessage = cart.map(item => {
        return `${item.name} - ${item.price}`;
    }).join('\n');

    // Отправляем сообщение в Telegram
    bot.sendMessage(chatId, `Ваш заказ:\n${cartMessage}`)
    .then(() => {
        res.json({ success: true });
    })
    .catch(error => {
        console.error('Ошибка отправки в Telegram:', error);
        res.json({ success: false });
    });
});

// Middleware для обработки ошибок
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).send(err.message);
  } else if (err) {
    return res.status(400).send(err.message);
  }
  next();
});

// Запуск сервера
app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
});
