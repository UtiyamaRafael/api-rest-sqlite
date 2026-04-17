const express = require('express');
const path = require('path');
const { initDB } = require('./config/db');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const bookRoutes = require('./routes/posts');
const errorHandler = require('./middlewares/errorHandler');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

initDB().catch((err) => {
  console.error('Falha ao inicializar o banco de dados:', err);
  process.exit(1);
});

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/api', bookRoutes);

app.use(errorHandler);

module.exports = app;
