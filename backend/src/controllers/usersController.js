const db = require('../config/db');

exports.searchUsers = async (req, res, next) => {
  try {
    const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    if (!query) return res.json({ users: [] });
    const [users] = await db.execute(`
      SELECT u.id, u.name, u.created_at,
             COALESCE(i.listings, 0) AS listings,
             COALESCE(i.lost, 0) AS lost,
             COALESCE(i.found, 0) AS found
      FROM users u
      LEFT JOIN (
        SELECT user_id, COUNT(*) AS listings,
               SUM(type = 'LOST') AS lost, SUM(type = 'FOUND') AS found
        FROM items WHERE status IN ('ACTIVE', 'MATCHED') GROUP BY user_id
      ) i ON i.user_id = u.id
      WHERE u.role = 'STUDENT' AND u.name LIKE ?
      ORDER BY u.name LIMIT 25
    `, [`%${query}%`]);
    res.json({ users });
  } catch (err) {
    next(err);
  }
};

exports.getUser = async (req, res, next) => {
  try {
    const [users] = await db.execute(`
      SELECT u.id, u.name, u.created_at,
             COUNT(i.id) AS listings,
             COALESCE(SUM(i.type = 'LOST'), 0) AS lost,
             COALESCE(SUM(i.type = 'FOUND'), 0) AS found
      FROM users u LEFT JOIN items i ON i.user_id = u.id AND i.status IN ('ACTIVE', 'MATCHED')
      WHERE u.id = ? AND u.role = 'STUDENT' GROUP BY u.id
    `, [req.params.id]);
    if (!users.length) return res.status(404).json({ error: 'Student profile not found.' });
    res.json(users[0]);
  } catch (err) {
    next(err);
  }
};

exports.getUserItems = async (req, res, next) => {
  try {
    const { type, q } = req.query;
    const [users] = await db.execute('SELECT id, name FROM users WHERE id = ? AND role = \'STUDENT\'', [req.params.id]);
    if (!users.length) return res.status(404).json({ error: 'Student profile not found.' });
    let sql = `
      SELECT i.id, i.user_id, i.type, i.title, i.description, i.category_id, i.location_id,
             i.latitude, i.longitude, i.location_note, i.date_occurred, i.image_url, i.status,
             i.color, i.given_to_department, i.created_at,
             c.name AS category_name, l.name AS location_name, u.name AS user_name
      FROM items i
      JOIN users u ON u.id = i.user_id
      LEFT JOIN categories c ON c.id = i.category_id
      LEFT JOIN locations l ON l.id = i.location_id
      WHERE i.user_id = ? AND i.status IN ('ACTIVE', 'MATCHED')`;
    const params = [req.params.id];
    if (type === 'LOST' || type === 'FOUND') { sql += ' AND i.type = ?'; params.push(type); }
    if (typeof q === 'string' && q.trim()) {
      sql += ' AND (i.title LIKE ? OR i.description LIKE ?)';
      params.push(`%${q.trim()}%`, `%${q.trim()}%`);
    }
    sql += ' ORDER BY i.created_at DESC LIMIT 100';
    const [items] = await db.execute(sql, params);
    res.json({ user: users[0], items });
  } catch (err) {
    next(err);
  }
};
