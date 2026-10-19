const db = require('../config/db');

exports.getConversations = async (req, res, next) => {
  try {
    const [rows] = await db.execute(`
      SELECT m.id, m.sender_id, m.recipient_id, m.item_id, m.body, m.read_at, m.created_at,
             sender.name AS sender_name, recipient.name AS recipient_name, i.title AS item_title
      FROM messages m
      JOIN users sender ON sender.id = m.sender_id
      JOIN users recipient ON recipient.id = m.recipient_id
      LEFT JOIN items i ON i.id = m.item_id
      WHERE m.sender_id = ? OR m.recipient_id = ?
      ORDER BY m.id DESC LIMIT 300
    `, [req.user.id, req.user.id]);

    const conversations = new Map();
    for (const row of rows) {
      const otherId = row.sender_id === req.user.id ? row.recipient_id : row.sender_id;
      if (!conversations.has(otherId)) {
        conversations.set(otherId, {
          user_id: otherId,
          user_name: row.sender_id === req.user.id ? row.recipient_name : row.sender_name,
          last_message: row.body,
          item_id: row.item_id,
          item_title: row.item_title,
          created_at: row.created_at,
          unread: 0
        });
      }
      if (row.recipient_id === req.user.id && !row.read_at) conversations.get(otherId).unread += 1;
    }
    res.json([...conversations.values()]);
  } catch (err) {
    next(err);
  }
};

exports.getThread = async (req, res, next) => {
  try {
    const otherId = Number(req.params.userId);
    if (!Number.isInteger(otherId) || otherId < 1 || otherId === req.user.id) {
      return res.status(400).json({ error: 'Choose another user to open a conversation.' });
    }
    const [users] = await db.execute('SELECT id, name FROM users WHERE id = ? AND role = \'STUDENT\'', [otherId]);
    if (!users.length) return res.status(404).json({ error: 'Student not found.' });

    await db.execute('UPDATE messages SET read_at = CURRENT_TIMESTAMP WHERE sender_id = ? AND recipient_id = ? AND read_at IS NULL', [otherId, req.user.id]);
    const [messages] = await db.execute(`
      SELECT m.id, m.sender_id, m.recipient_id, m.item_id, m.body, m.read_at, m.created_at,
             u.name AS sender_name, i.title AS item_title
      FROM messages m
      JOIN users u ON u.id = m.sender_id
      LEFT JOIN items i ON i.id = m.item_id
      WHERE (m.sender_id = ? AND m.recipient_id = ?) OR (m.sender_id = ? AND m.recipient_id = ?)
      ORDER BY m.id ASC LIMIT 500
    `, [req.user.id, otherId, otherId, req.user.id]);
    res.json({ user: users[0], messages });
  } catch (err) {
    next(err);
  }
};

exports.sendMessage = async (req, res, next) => {
  try {
    const recipientId = Number(req.body?.recipient_id);
    const body = typeof req.body?.body === 'string' ? req.body.body.trim() : '';
    const itemId = req.body?.item_id ? Number(req.body.item_id) : null;
    if (!Number.isInteger(recipientId) || recipientId < 1 || recipientId === req.user.id) {
      return res.status(400).json({ error: 'Choose another student to message.' });
    }
    if (!body) return res.status(400).json({ error: 'Write a message before sending.' });
    if (body.length > 2000) return res.status(400).json({ error: 'Messages must be 2,000 characters or fewer.' });
    const [recipients] = await db.execute('SELECT id FROM users WHERE id = ? AND role = \'STUDENT\'', [recipientId]);
    if (!recipients.length) return res.status(404).json({ error: 'Student not found.' });
    if (itemId) {
      if (!Number.isInteger(itemId)) return res.status(400).json({ error: 'Invalid listing.' });
      const [items] = await db.execute('SELECT id, user_id FROM items WHERE id = ? AND user_id IN (?, ?)', [itemId, req.user.id, recipientId]);
      if (!items.length) return res.status(404).json({ error: 'Listing not found.' });
    }

    const [result] = await db.execute(
      'INSERT INTO messages (sender_id, recipient_id, item_id, body) VALUES (?, ?, ?, ?)',
      [req.user.id, recipientId, itemId, body]
    );
    const link = `/messages?user=${recipientId}${itemId ? `&item=${itemId}` : ''}`;
    await db.execute(
      'INSERT INTO notifications (user_id, title, message, type, link) VALUES (?, ?, ?, ?, ?)',
      [recipientId, 'New message', 'You received a new listing message.', 'MESSAGE', link]
    );
    res.status(201).json({ id: result.insertId, message: 'Message sent.' });
  } catch (err) {
    next(err);
  }
};
