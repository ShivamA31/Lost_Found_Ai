const db = require('../config/db');
const axios = require('axios');
const env = require('../config/env');
const matchService = require('../services/matchService');

async function indexItem(itemId, type, text) {
  const response = await axios.post(`${env.AI_SERVICE_URL}/index/upsert`, { item_id: itemId, type, text });
  const buffer = Buffer.from(new Float32Array(response.data.embedding).buffer);
  await db.execute(
    'INSERT INTO item_embeddings (item_id, embedding, model_name) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE embedding = VALUES(embedding), model_name = VALUES(model_name)',
    [itemId, buffer, 'all-MiniLM-L6-v2']
  );
}

exports.getItems = async (req, res, next) => {
  try {
    const { type, category, location, status, page = 1, limit = 20 } = req.query;
    let query = 'SELECT i.*, c.name as category_name, l.name as location_name, u.name as user_name FROM items i LEFT JOIN categories c ON i.category_id = c.id LEFT JOIN locations l ON i.location_id = l.id JOIN users u ON u.id = i.user_id WHERE 1=1';
    const params = [];

    if (type) {
      query += ' AND i.type = ?';
      params.push(type);
    }
    if (category) {
      query += ' AND i.category_id = ?';
      params.push(category);
    }
    if (location) {
      query += ' AND i.location_id = ?';
      params.push(location);
    }
    if (status) {
      query += ' AND i.status = ?';
      params.push(status);
    } else {
      query += ' AND i.status = "ACTIVE"';
    }

    query += ' ORDER BY i.created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), (Number(page) - 1) * Number(limit));

    const [items] = await db.execute(query, params);
    
    // Count query
    let countQuery = 'SELECT COUNT(*) as total FROM items i WHERE 1=1';
    const countParams = [];
    if (type) { countQuery += ' AND i.type = ?'; countParams.push(type); }
    if (category) { countQuery += ' AND i.category_id = ?'; countParams.push(category); }
    if (location) { countQuery += ' AND i.location_id = ?'; countParams.push(location); }
    if (status) { countQuery += ' AND i.status = ?'; countParams.push(status); } else { countQuery += ' AND i.status = "ACTIVE"'; }
    
    const [counts] = await db.execute(countQuery, countParams);
    
    // Remove verification_hint
    items.forEach(item => delete item.verification_hint);
    
    res.json({ items, total: counts[0].total });
  } catch (err) {
    next(err);
  }
};

exports.getMyItems = async (req, res, next) => {
  try {
    const [items] = await db.execute(
      'SELECT i.*, c.name as category_name, l.name as location_name, u.name as user_name FROM items i LEFT JOIN categories c ON i.category_id = c.id LEFT JOIN locations l ON i.location_id = l.id JOIN users u ON u.id = i.user_id WHERE i.user_id = ? ORDER BY i.created_at DESC',
      [req.user.id]
    );
    res.json(items);
  } catch (err) {
    next(err);
  }
};

exports.getItemById = async (req, res, next) => {
  try {
    const [items] = await db.execute(
      'SELECT i.*, c.name as category_name, l.name as location_name, u.name as user_name FROM items i LEFT JOIN categories c ON i.category_id = c.id LEFT JOIN locations l ON i.location_id = l.id LEFT JOIN users u ON i.user_id = u.id WHERE i.id = ?',
      [req.params.id]
    );
    if (items.length === 0) return res.status(404).json({ error: 'Item not found' });
    
    const item = items[0];
    if (!req.user || (req.user.id !== item.user_id && req.user.role !== 'ADMIN')) {
      delete item.verification_hint;
    }
    
    res.json(item);
  } catch (err) {
    next(err);
  }
};

exports.createItem = async (req, res, next) => {
  try {
    const { type, title, description, category_id, location_id, latitude, longitude, location_note, date_occurred, verification_hint, given_to_department } = req.body || {};
    if (!['LOST', 'FOUND'].includes(type)) return res.status(400).json({ error: 'Choose whether this report is for a lost or found item.' });
    if (typeof title !== 'string' || !title.trim()) return res.status(400).json({ error: 'Item title is required.' });
    if (typeof description !== 'string' || !description.trim()) return res.status(400).json({ error: 'Description is required so the matching assistant can compare reports.' });
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
    
    // Auto-extract color (simple implementation for now)
    const colorList = ['black', 'white', 'red', 'blue', 'green', 'grey', 'gray', 'yellow', 'brown', 'pink', 'purple', 'orange', 'silver', 'gold'];
    let color = null;
    const searchString = `${title} ${description}`.toLowerCase();
    for (const c of colorList) {
      if (searchString.includes(c)) {
        color = c === 'gray' ? 'grey' : c;
        break;
      }
    }
    
    const [result] = await db.execute(
      'INSERT INTO items (user_id, type, title, description, category_id, location_id, latitude, longitude, location_note, date_occurred, verification_hint, given_to_department, color, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, type, title.trim(), description.trim(), category_id || null, location_id || null, latitude || null, longitude || null, location_note || null, date_occurred || null, verification_hint?.trim() || null, given_to_department === true || given_to_department === 'true' || given_to_department === '1', color, imageUrl]
    );
    
    const itemId = result.insertId;
    
    let aiStatus = 'offline';
    // Embed this report and compare it with opposite-type reports using AI.
    try {
      await indexItem(itemId, type, `${category_id || ''} ${searchString} ${location_note || ''}`.trim());
      
      // We should ideally fetch the embedding to save it in item_embeddings, 
      // but for simplicity we will just let AI service handle it for the FAISS index
      // Alternatively, we get the embedding and save it to DB
      
      // Trigger match generation
      await matchService.findAndCreateMatches(itemId);
      aiStatus = 'ready';
    } catch (aiErr) {
      console.error('AI Service Error:', aiErr.message);
    }
    
    res.status(201).json({ id: itemId, ai_status: aiStatus, message: 'Item created successfully' });
  } catch (err) {
    next(err);
  }
};

exports.updateItem = async (req, res, next) => {
  try {
    const [items] = await db.execute('SELECT * FROM items WHERE id = ?', [req.params.id]);
    if (items.length === 0) return res.status(404).json({ error: 'Item not found' });
    if (items[0].user_id !== req.user.id && req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });

    const current = items[0];
    const body = req.body || {};
    const allowed = ['title', 'description', 'category_id', 'location_id', 'latitude', 'longitude', 'location_note', 'date_occurred', 'verification_hint'];
    const changes = {};
    for (const field of allowed) {
      if (!Object.hasOwn(body, field)) continue;
      const value = typeof body[field] === 'string' ? body[field].trim() : body[field];
      changes[field] = ['category_id', 'location_id', 'latitude', 'longitude'].includes(field) && value === '' ? null : value;
    }
    if (Object.hasOwn(body, 'given_to_department')) {
      changes.given_to_department = body.given_to_department === true || body.given_to_department === 'true' || body.given_to_department === '1';
    }
    if (Object.hasOwn(body, 'status')) {
      if (!['ACTIVE', 'MATCHED', 'CLAIMED', 'CLOSED'].includes(body.status)) return res.status(400).json({ error: 'Choose a valid listing status.' });
      changes.status = body.status;
    }
    if (req.file) changes.image_url = `/uploads/${req.file.filename}`;
    if (Object.hasOwn(changes, 'title') && !changes.title) return res.status(400).json({ error: 'Item title is required.' });
    if (Object.hasOwn(changes, 'description') && !changes.description) return res.status(400).json({ error: 'Description is required.' });
    const fields = Object.keys(changes);
    if (fields.length === 0) return res.status(400).json({ error: 'There are no listing changes to save.' });

    await db.execute(`UPDATE items SET ${fields.map(field => `\`${field}\` = ?`).join(', ')} WHERE id = ?`, [...fields.map(field => changes[field]), current.id]);
    const listingFields = ['title', 'description', 'category_id', 'location_id', 'latitude', 'longitude', 'location_note', 'date_occurred'];
    if (fields.some(field => listingFields.includes(field))) {
      await db.execute('DELETE FROM matches WHERE (lost_item_id = ? OR found_item_id = ?) AND status = \'PENDING\' AND id NOT IN (SELECT match_id FROM claims)', [current.id, current.id]);
      const updated = { ...current, ...changes };
      try {
        const text = `${updated.title} ${updated.description || ''} ${updated.location_note || ''}`.trim();
        const indexResponse = await axios.post(`${env.AI_SERVICE_URL}/index/upsert`, { item_id: current.id, type: current.type, text });
        const buffer = Buffer.from(new Float32Array(indexResponse.data.embedding).buffer);
        await db.execute('INSERT INTO item_embeddings (item_id, embedding, model_name) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE embedding = VALUES(embedding), model_name = VALUES(model_name)', [current.id, buffer, 'all-MiniLM-L6-v2']);
        await matchService.findAndCreateMatches(current.id);
      } catch (aiErr) {
        console.error('AI re-index error:', aiErr.message);
      }
    }
    const [updatedRows] = await db.execute('SELECT * FROM items WHERE id = ?', [current.id]);
    res.json({ item: updatedRows[0], message: 'Listing updated.' });
  } catch (err) {
    next(err);
  }
};

exports.deleteItem = async (req, res, next) => {
  try {
    const [items] = await db.execute('SELECT user_id FROM items WHERE id = ?', [req.params.id]);
    if (items.length === 0) return res.status(404).json({ error: 'Item not found' });
    if (items[0].user_id !== req.user.id && req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
    
    await db.execute('DELETE FROM items WHERE id = ?', [req.params.id]);
    res.status(200).json({ message: 'Item deleted successfully' });
  } catch (err) {
    next(err);
  }
};
