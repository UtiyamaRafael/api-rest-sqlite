const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');
const { databaseFile } = require('./database');

const dbPath = path.isAbsolute(databaseFile)
  ? databaseFile
  : path.join(__dirname, '../../', databaseFile);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Falha ao abrir o banco de dados:', err.message);
    throw err;
  }
});

const run = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });

const get = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });

const all = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });

const initDB = async () => {
  await run('PRAGMA foreign_keys = ON');
  await run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'reader',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  await run(`CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    isbn TEXT NOT NULL UNIQUE,
    description TEXT,
    published_year INTEGER,
    available INTEGER NOT NULL DEFAULT 1,
    user_id INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`);

  // Drop and recreate loans table to remove UNIQUE constraint
  await run(`DROP TABLE IF EXISTS loans`);
  await run(`CREATE TABLE IF NOT EXISTS loans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    book_id INTEGER NOT NULL,
    loan_date TEXT NOT NULL DEFAULT (datetime('now')),
    return_date TEXT,
    due_date TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
  )`);

  const userCount = await get('SELECT COUNT(*) AS count FROM users');
  let defaultUserId = null;

  if (!userCount || !userCount.count) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const result = await run(
      `INSERT INTO users (name, email, password, role, created_at, updated_at)
       VALUES (?, ?, ?, 'admin', datetime('now'), datetime('now'))`,
      ['Administrador', 'admin@biblioteca.com', hashedPassword]
    );
    defaultUserId = result.lastID;
  } else {
    const adminUser = await get("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
    if (adminUser) {
      defaultUserId = adminUser.id;
    } else {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const result = await run(
        `INSERT INTO users (name, email, password, role, created_at, updated_at)
         VALUES (?, ?, ?, 'admin', datetime('now'), datetime('now'))`,
        ['Administrador', 'admin@biblioteca.com', hashedPassword]
      );
      defaultUserId = result.lastID;
    }
  }

  const bookCount = await get('SELECT COUNT(*) AS count FROM books');
  if ((!bookCount || !bookCount.count) && defaultUserId) {
    const sampleBooks = [
      {
        title: 'O Senhor dos Anéis',
        author: 'J.R.R. Tolkien',
        isbn: '9780261103252',
        description: 'Uma aventura épica pela Terra Média.',
        published_year: 1954,
        available: 1,
      },
      {
        title: 'Dom Casmurro',
        author: 'Machado de Assis',
        isbn: '9788535912498',
        description: 'Romance clássico brasileiro sobre ciúme e memória.',
        published_year: 1899,
        available: 1,
      },
      {
        title: '1984',
        author: 'George Orwell',
        isbn: '9780451524935',
        description: 'Distopia política sobre vigilância e controle.',
        published_year: 1949,
        available: 1,
      },
    ];

    for (const book of sampleBooks) {
      await run(
        `INSERT INTO books (title, author, isbn, description, published_year, available, user_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
        [book.title, book.author, book.isbn, book.description, book.published_year, book.available, defaultUserId]
      );
    }
  }
};

module.exports = {
  db,
  run,
  get,
  all,
  initDB,
};
