const express = require('express');
const sqlite3 = require('sqlite3').verbose(); // Подключаем SQLite
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const app = express();
const port = 8888;

// Инициализация базы данных SQLite
const db = new sqlite3.Database('onlineShopDB.sqlite', (err) => {
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
    cb(null, 'public/uploads/'); // Папка для сохранения загруженных файлов
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Уникальное имя файла
  },
});

// Фильтр для загрузки изображений
const fileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|gif/; // Разрешенные расширения
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true); // Файл разрешен
  } else {
    cb(new Error('Ошибка: только изображения!')); // Ошибка для неподдерживаемых файлов
  }
};

// Инициализация multer с фильтром и обработкой нескольких файлов
const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
}).array('images'); // Здесь должно быть 'images', как в форме

// Настройки для EJS
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public')); // Разрешение доступа к статическим файлам

// Главная страница
app.get('/', (req, res) => {
  db.all('SELECT * FROM products', [], (err, products) => {
    if (err) {
      throw err;
    }
    res.render('index', { products });
  });
});

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
  const images = req.files.map(file => `/uploads/${file.filename}`).join(','); // Получаем пути к загруженным изображениям и объединяем их строкой

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

// Middleware для обработки ошибок
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).send(err.message); // Ошибка загрузки файла
  } else if (err) {
    return res.status(400).send(err.message); // Другие ошибки
  }
  next();
});

// Запуск сервера
app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
});
