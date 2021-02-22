const path = require('path');
const multer = require('multer');
const express = require('express');
const bodyParser = require('body-parser');

const feedRoutes = require('./routes/feed');
const authRoutes = require('./routes/auth');

const app = express();

//#region: Parse form-data files(images and so on)
const fileStorage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'images');
  },
  filename(req, file, cb) {
    cb(null, `${new Date().toISOString().replace(/:/g, '-')}-${file.originalname}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg' || file.mimetype === 'image/png') {
    cb(null, true);
  } else {
    cb(null, false);
  }
};
//#endregion: Parse form-data files(images and so on)

app.use(bodyParser.urlencoded({ extended: false })); // Parse form data from incoming requests (x-www-form-urlencoded)
app.use(bodyParser.json()); // Parse JSON data from incoming requests (application/json)

// Парсит body запросов, если там не текстовые данные, а файлы
// image - form field name
app.use(multer({ storage: fileStorage, fileFilter }).single('image'));

// Public available for 'images' directories
app.use('/images', express.static(path.join(__dirname, 'images')));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

app.use('/feed', feedRoutes);
app.use('/auth', authRoutes);

// Special 'express' middleware for handling all errors in the app. Fires like 'next(new Error(err))' from other places.
app.use((err, req, res, next) => {
  console.log(err);
  res.status(err.statusCode).json({ message: err.message, data: err.data });
});

module.exports = app;
