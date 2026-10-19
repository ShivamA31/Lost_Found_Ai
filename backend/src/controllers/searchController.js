const db = require('../config/db');
const axios = require('axios');
const env = require('../config/env');

exports.search = async (req, res, next) => {
  try {
    const { q, type } = req.query;
    
    // We search the opposite type by default if type is provided, else both
    let targetType = type === 'LOST' ? 'FOUND' : (type === 'FOUND' ? 'LOST' : null);
    
    // Semantic Search
    let semanticResults = [];
    if (q) {
      try {
        if (targetType) {
          const searchRes = await axios.post(`${env.AI_SERVICE_URL}/search`, { text: q, type_to_search: targetType, top_k: 30 });
          semanticResults = searchRes.data;
        } else {
          const [resLost, resFound] = await Promise.all([
            axios.post(`${env.AI_SERVICE_URL}/search`, { text: q, type_to_search: 'LOST', top_k: 20 }),
            axios.post(`${env.AI_SERVICE_URL}/search`, { text: q, type_to_search: 'FOUND', top_k: 20 })
          ]);
          semanticResults = [...resLost.data, ...resFound.data];
        }
      } catch (aiError) {
        console.error('AI search unavailable; using listing text search:', aiError.message);
      }
    }
    const scoreMap = new Map(semanticResults.map(result => [Number(result.item_id), Number(result.semantic_score) || 0]));
    const ids = [...scoreMap.keys()].filter(id => Number.isInteger(id) && id > 0);
    const params = [];
    const clauses = [];
    if (ids.length) { clauses.push(`i.id IN (${ids.map(() => '?').join(',')})`); params.push(...ids); }
    if (q?.trim()) {
      clauses.push('(i.title LIKE ? OR i.description LIKE ? OR l.name LIKE ?)');
      params.push(`%${q.trim()}%`, `%${q.trim()}%`, `%${q.trim()}%`);
    }
    if (!clauses.length) return res.json({ results: [], total: 0 });
    const typeClause = targetType ? ' AND i.type = ?' : '';
    if (targetType) params.push(targetType);
    const [dbItems] = await db.execute(
      `SELECT i.*, c.name AS category_name, l.name AS location_name, u.name AS user_name
       FROM items i LEFT JOIN categories c ON i.category_id = c.id
       LEFT JOIN locations l ON i.location_id = l.id JOIN users u ON u.id = i.user_id
       WHERE i.status IN ('ACTIVE','MATCHED') AND (${clauses.join(' OR ')})${typeClause} LIMIT 100`, params
    );
    const items = dbItems.map(item => {
      delete item.verification_hint;
      const semantic = scoreMap.get(Number(item.id)) || 0;
      const keyword = q && `${item.title} ${item.description}`.toLowerCase().includes(String(q).toLowerCase()) ? 1 : 0;
      return { ...item, similarity: Math.round(Math.max(semantic, keyword * 0.45) * 100) };
    }).filter(item => item.similarity >= 35).sort((a, b) => b.similarity - a.similarity).slice(0, 20);
    
    res.json({ results: items, total: items.length });
  } catch (err) {
    next(err);
  }
};
