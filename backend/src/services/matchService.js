const db = require('../config/db');
const env = require('../config/env');
const axios = require('axios');
const scoringService = require('./scoringService');

exports.findAndCreateMatches = async (itemId) => {
  try {
    // 1. Get the item
    const [items] = await db.execute('SELECT * FROM items WHERE id = ?', [itemId]);
    if (items.length === 0) return;
    const item = items[0];

    // 2. Determine target type for search
    const targetType = item.type === 'LOST' ? 'FOUND' : 'LOST';

    // 3. Search in AI service
    const searchString = `${item.category_id || ''} ${item.title} ${item.description} ${item.location_note || ''}`.trim();
    const searchRes = await axios.post(`${env.AI_SERVICE_URL}/search`, {
      text: searchString,
      type_to_search: targetType,
      top_k: 10
    });
    
    const candidates = searchRes.data; // [{item_id, semantic_score}]
    if (!candidates || candidates.length === 0) return;

    // 4. Score each candidate
    for (const candidate of candidates) {
      if (candidate.item_id === item.id) continue; // safety check
      
      const [candidateItems] = await db.execute('SELECT * FROM items WHERE id = ? AND status = "ACTIVE"', [candidate.item_id]);
      if (candidateItems.length === 0) continue;
      const targetItem = candidateItems[0];
      
      // Do not match user's own items
      if (targetItem.user_id === item.user_id) continue;

      const scoreResult = scoringService.calculateScore(
        item.type === 'LOST' ? item : targetItem,
        item.type === 'FOUND' ? item : targetItem,
        candidate.semantic_score
      );

      if (scoreResult.finalScore >= env.MATCH_THRESHOLD) {
        const lostItemId = item.type === 'LOST' ? item.id : targetItem.id;
        const foundItemId = item.type === 'FOUND' ? item.id : targetItem.id;

        // Upsert match
        const [matchWrite] = await db.execute(
          `INSERT INTO matches 
          (lost_item_id, found_item_id, similarity_score, semantic_score, category_score, location_score, date_score, color_score, match_reason, status) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')
          ON DUPLICATE KEY UPDATE 
          similarity_score = VALUES(similarity_score), semantic_score = VALUES(semantic_score),
          category_score = VALUES(category_score), location_score = VALUES(location_score),
          date_score = VALUES(date_score), color_score = VALUES(color_score), match_reason = VALUES(match_reason)`,
          [
            lostItemId, foundItemId, scoreResult.finalScore, scoreResult.semanticScore,
            scoreResult.categoryScore, scoreResult.locationScore, scoreResult.dateScore,
            scoreResult.colorScore, JSON.stringify(scoreResult.reasons)
          ]
        );

        // Notify only when this pair is newly discovered; a re-index must not spam users.
        const [lostOwners] = matchWrite.affectedRows === 1
          ? await db.execute('SELECT user_id FROM items WHERE id = ?', [lostItemId])
          : [[]];
        if (lostOwners.length > 0) {
          const ownerId = lostOwners[0].user_id;
          await db.execute(
            'INSERT INTO notifications (user_id, title, message, type, link) VALUES (?, ?, ?, ?, ?)',
            [ownerId, 'New Potential Match!', 'We found an item that looks like yours.', 'MATCH_FOUND', `/item/${lostItemId}`]
          );
        }
      }
    }

  } catch (err) {
    console.error('Error finding matches:', err.message);
  }
};
