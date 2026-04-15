const { run, get, all } = require('../config/db');

const allowedSortFields = ['id', 'loan_date', 'due_date', 'return_date', 'created_at', 'updated_at'];

const create = async ({ user_id, book_id, due_date }) => {
  const result = await run(
    `INSERT INTO loans (user_id, book_id, due_date, created_at, updated_at)
     VALUES (?, ?, ?, datetime('now'), datetime('now'))`,
    [user_id, book_id, due_date]
  );

  return findById(result.lastID);
};

const findById = async (id) =>
  get(
    `SELECT l.id, l.user_id, l.book_id, l.loan_date, l.due_date, l.return_date, l.created_at, l.updated_at,
            u.name AS user_name, u.email AS user_email,
            b.title AS book_title, b.author AS book_author, b.isbn AS book_isbn
     FROM loans l
     JOIN users u ON l.user_id = u.id
     JOIN books b ON l.book_id = b.id
     WHERE l.id = ?`,
    [id]
  );

const findByUserAndBook = async (user_id, book_id) =>
  get('SELECT * FROM loans WHERE user_id = ? AND book_id = ? AND return_date IS NULL', [user_id, book_id]);

const list = async ({ user_id, book_id, returned, sort = 'created_at', order = 'desc', page = 1, limit = 10 }) => {
  const filterClauses = [];
  const params = [];

  if (user_id) {
    filterClauses.push('l.user_id = ?');
    params.push(Number(user_id));
  }

  if (book_id) {
    filterClauses.push('l.book_id = ?');
    params.push(Number(book_id));
  }

  if (returned !== undefined) {
    if (returned) {
      filterClauses.push('l.return_date IS NOT NULL');
    } else {
      filterClauses.push('l.return_date IS NULL');
    }
  }

  const where = filterClauses.length ? `WHERE ${filterClauses.join(' AND ')}` : '';
  const field = allowedSortFields.includes(sort) ? `l.${sort}` : 'l.created_at';
  const orderDirection = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
  const offset = (Number(page) - 1) * Number(limit);

  const totalRow = await get(`SELECT COUNT(*) AS count FROM loans l ${where}`, params);
  const loans = await all(
    `SELECT l.id, l.user_id, l.book_id, l.loan_date, l.due_date, l.return_date, l.created_at, l.updated_at,
            u.name AS user_name, u.email AS user_email,
            b.title AS book_title, b.author AS book_author, b.isbn AS book_isbn
     FROM loans l
     JOIN users u ON l.user_id = u.id
     JOIN books b ON l.book_id = b.id
     ${where}
     ORDER BY ${field} ${orderDirection}
     LIMIT ?
     OFFSET ?`,
    [...params, Number(limit), offset]
  );

  return {
    total: totalRow ? totalRow.count : 0,
    data: loans,
  };
};

const update = async (id, data) => {
  const updates = [];
  const params = [];

  if (data.return_date) {
    updates.push('return_date = ?');
    params.push(data.return_date);
  }

  if (!updates.length) {
    return findById(id);
  }

  params.push(new Date().toISOString());
  params.push(id);

  await run(
    `UPDATE loans SET ${updates.join(', ')}, updated_at = ? WHERE id = ?`,
    params
  );

  return findById(id);
};

const remove = async (id) => {
  const result = await run('DELETE FROM loans WHERE id = ?', [id]);
  return result.changes > 0;
};

module.exports = {
  create,
  findById,
  findByUserAndBook,
  list,
  update,
  remove,
};