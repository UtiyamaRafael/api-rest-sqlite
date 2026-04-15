const { run, get, all } = require('../config/db');

const allowedSortFields = ['id', 'title', 'published_year', 'created_at', 'updated_at'];

const create = async ({ title, author, isbn, description, published_year, available, user_id }) => {
  const result = await run(
    `INSERT INTO books (title, author, isbn, description, published_year, available, user_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
    [title, author, isbn, description || null, published_year || null, available ? 1 : 0, user_id]
  );

  return findById(result.lastID);
};

const findById = async (id) =>
  get(
    `SELECT b.id, b.title, b.author, b.isbn, b.description, b.published_year, b.available,
            b.user_id, b.created_at, b.updated_at,
            u.name AS creator_name, u.email AS creator_email
     FROM books b
     JOIN users u ON b.user_id = u.id
     WHERE b.id = ?`,
    [id]
  );

const list = async ({ keyword, title, author, isbn, available, user_id, sort = 'created_at', order = 'desc', page = 1, limit = 10 }) => {
  const filterClauses = [];
  const params = [];

  if (keyword) {
    filterClauses.push('(b.title LIKE ? OR b.author LIKE ? OR b.isbn LIKE ?)');
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }

  if (title) {
    filterClauses.push('b.title LIKE ?');
    params.push(`%${title}%`);
  }

  if (author) {
    filterClauses.push('b.author LIKE ?');
    params.push(`%${author}%`);
  }

  if (isbn) {
    filterClauses.push('b.isbn LIKE ?');
    params.push(`%${isbn}%`);
  }

  if (available !== undefined) {
    filterClauses.push('b.available = ?');
    params.push(available ? 1 : 0);
  }

  if (user_id) {
    filterClauses.push('b.user_id = ?');
    params.push(Number(user_id));
  }

  const where = filterClauses.length ? `WHERE ${filterClauses.join(' AND ')}` : '';
  const field = allowedSortFields.includes(sort) ? `b.${sort}` : 'b.created_at';
  const orderDirection = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
  const offset = (Number(page) - 1) * Number(limit);

  const totalRow = await get(`SELECT COUNT(*) AS count FROM books b ${where}`, params);
  const books = await all(
    `SELECT b.id, b.title, b.author, b.isbn, b.description, b.published_year, b.available,
            b.user_id, b.created_at, b.updated_at,
            u.name AS creator_name, u.email AS creator_email
     FROM books b
     JOIN users u ON b.user_id = u.id
     ${where}
     ORDER BY ${field} ${orderDirection}
     LIMIT ?
     OFFSET ?`,
    [...params, Number(limit), offset]
  );

  return {
    total: totalRow ? totalRow.count : 0,
    data: books.map((book) => ({
      ...book,
      available: Boolean(book.available),
    })),
  };
};

const update = async (id, data) => {
  const updates = [];
  const params = [];

  if (data.title) {
    updates.push('title = ?');
    params.push(data.title);
  }

  if (data.content) {
    updates.push('content = ?');
    params.push(data.content);
  }

  if (data.published !== undefined) {
    updates.push('published = ?');
    params.push(data.published ? 1 : 0);
  }

  if (!updates.length) {
    return findById(id);
  }

  params.push(new Date().toISOString());
  params.push(id);

  await run(
    `UPDATE books SET ${updates.join(', ')}, updated_at = ? WHERE id = ?`,
    params
  );

  return findById(id);
};

const remove = async (id) => {
  const result = await run('DELETE FROM books WHERE id = ?', [id]);
  return result.changes > 0;
};

module.exports = {
  create,
  findById,
  list,
  update,
  remove,
};
