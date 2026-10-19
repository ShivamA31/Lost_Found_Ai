const db = require('../config/db');
const matchService = require('../services/matchService');

exports.getItemMatches = async (req, res, next) => {
  try {
    const itemId = req.params.itemId;
    // ensure user owns item or is admin
    const [items] = await db.execute('SELECT user_id, type FROM items WHERE id = ?', [itemId]);
    if (items.length === 0) return res.status(404).json({ error: 'Item not found' });
    if (items[0].user_id !== req.user.id && req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
    
    const isLost = items[0].type === 'LOST';
    
    // get matches
    const [matches] = await db.execute(
      `SELECT m.*, other.id AS other_item_id, other.user_id AS other_user_id,
              other.title, other.description, other.image_url, other.status AS item_status,
              other.date_occurred, other.given_to_department,
              owner.name AS user_name, c.name AS category_name, l.name AS location_name
       FROM matches m
       JOIN items other ON other.id = CASE WHEN ? = 'LOST' THEN m.found_item_id ELSE m.lost_item_id END
       JOIN users owner ON owner.id = other.user_id
       LEFT JOIN categories c ON other.category_id = c.id
       LEFT JOIN locations l ON other.location_id = l.id
       WHERE (m.lost_item_id = ? OR m.found_item_id = ?) AND m.status <> 'REJECTED'
       ORDER BY m.similarity_score DESC`,
      [items[0].type, itemId, itemId]
    );
    
    // parse reason
    matches.forEach(m => {
      if (typeof m.match_reason === 'string') {
        try { m.match_reason = JSON.parse(m.match_reason); } catch(e){}
      }
    });
    
    res.json(matches);
  } catch (err) {
    next(err);
  }
};

exports.generateMatches = async (req, res, next) => {
  try {
    const itemId = req.params.itemId;
    await matchService.findAndCreateMatches(itemId);
    res.json({ message: 'Matches re-generated successfully' });
  } catch (err) {
    next(err);
  }
};

exports.confirmMatch = async (req, res, next) => {
  try {
    const [matches] = await db.execute('SELECT * FROM matches WHERE id = ?', [req.params.id]);
    if (!matches.length) return res.status(404).json({ error: 'Match not found.' });
    const match = matches[0];
    const [owners] = await db.execute('SELECT id, user_id FROM items WHERE id IN (?, ?)', [match.lost_item_id, match.found_item_id]);
    if (req.user.role !== 'ADMIN' && !owners.some(item => item.user_id === req.user.id)) return res.status(403).json({ error: 'Only a listing owner can confirm this match.' });
    await db.execute('UPDATE matches SET status = "CONFIRMED" WHERE id = ?', [match.id]);
    await db.execute('UPDATE items SET status = "MATCHED" WHERE id IN (?, ?) AND status = "ACTIVE"', [match.lost_item_id, match.found_item_id]);
    res.json({ message: 'Match confirmed. Please start a claim.' });
  } catch (err) {
    next(err);
  }
};

exports.rejectMatch = async (req, res, next) => {
  try {
    const [matches] = await db.execute('SELECT lost_item_id, found_item_id FROM matches WHERE id = ?', [req.params.id]);
    if (!matches.length) return res.status(404).json({ error: 'Match not found.' });
    const [owners] = await db.execute('SELECT user_id FROM items WHERE id IN (?, ?)', [matches[0].lost_item_id, matches[0].found_item_id]);
    if (req.user.role !== 'ADMIN' && !owners.some(item => item.user_id === req.user.id)) return res.status(403).json({ error: 'Only a listing owner can reject this match.' });
    await db.execute('UPDATE matches SET status = "REJECTED" WHERE id = ?', [req.params.id]);
    res.json({ message: 'Match rejected.' });
  } catch (err) {
    next(err);
  }
};
