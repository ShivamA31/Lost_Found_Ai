const db = require('../config/db');

exports.getClaimInfo = async (req, res, next) => {
  try {
    const [rows] = await db.execute(`
      SELECT m.id AS match_id, m.lost_item_id, m.found_item_id,
             lost.user_id AS lost_owner_id, lost.title AS lost_title,
             found.title AS found_title, found.verification_hint
      FROM matches m JOIN items lost ON lost.id = m.lost_item_id
      JOIN items found ON found.id = m.found_item_id WHERE m.id = ?`, [req.params.matchId]);
    if (!rows.length) return res.status(404).json({ error: 'Match not found.' });
    const info = rows[0];
    if (req.user.role !== 'ADMIN' && info.lost_owner_id !== req.user.id) return res.status(403).json({ error: 'Only the owner of the lost report can submit this claim.' });
    res.json({ match_id: info.match_id, lost_title: info.lost_title, found_title: info.found_title, requires_verification: Boolean(info.verification_hint), verification_hint: info.verification_hint || null });
  } catch (err) { next(err); }
};

exports.createClaim = async (req, res, next) => {
  try {
    const { match_id, claim_details, verification_answer } = req.body || {};
    if (!String(claim_details || '').trim()) return res.status(400).json({ error: 'Explain why this item belongs to you.' });
    
    // Check match exists
    const [matches] = await db.execute('SELECT * FROM matches WHERE id = ?', [match_id]);
    if (matches.length === 0) return res.status(404).json({ error: 'Match not found' });
    const match = matches[0];
    const [reports] = await db.execute('SELECT l.user_id AS lost_owner_id, f.verification_hint FROM items l JOIN items f ON f.id = ? WHERE l.id = ?', [match.found_item_id, match.lost_item_id]);
    if (!reports.length) return res.status(404).json({ error: 'The matched listings no longer exist.' });
    if (req.user.role !== 'ADMIN' && reports[0].lost_owner_id !== req.user.id) return res.status(403).json({ error: 'Only the owner of the lost report can submit this claim.' });
    if (reports[0].verification_hint && !String(verification_answer || '').trim()) return res.status(400).json({ error: 'Answer the finder’s private ownership question.' });
    
    // Check if duplicate claim
    const [existing] = await db.execute('SELECT * FROM claims WHERE match_id = ? AND claimant_id = ?', [match_id, req.user.id]);
    if (existing.length > 0) return res.status(400).json({ error: 'Claim already submitted' });
    
    const [result] = await db.execute(
      'INSERT INTO claims (match_id, claimant_id, claim_details, verification_answer) VALUES (?, ?, ?, ?)',
      [match_id, req.user.id, String(claim_details).trim(), String(verification_answer || '').trim() || null]
    );
    
    // Notify admin
    const [admins] = await db.execute('SELECT id FROM users WHERE role = "ADMIN"');
    for (const admin of admins) {
      await db.execute(
        'INSERT INTO notifications (user_id, title, message, type, link) VALUES (?, ?, ?, ?, ?)',
        [admin.id, 'New Claim Submitted', `User submitted a claim for match #${match_id}`, 'CLAIM_SUBMITTED', `/admin`]
      );
    }
    
    res.status(201).json({ id: result.insertId, message: 'Claim submitted successfully' });
  } catch (err) {
    next(err);
  }
};

exports.getMyClaims = async (req, res, next) => {
  try {
    const [claims] = await db.execute(
      'SELECT c.*, m.lost_item_id, m.found_item_id FROM claims c JOIN matches m ON c.match_id = m.id WHERE c.claimant_id = ? ORDER BY c.created_at DESC',
      [req.user.id]
    );
    res.json(claims);
  } catch (err) {
    next(err);
  }
};

exports.getAllClaims = async (req, res, next) => {
  try {
    const [claims] = await db.execute(
      `SELECT c.*, u.name as claimant_name, 
              m.lost_item_id, m.found_item_id, m.similarity_score,
              i_lost.title as lost_title, i_found.title as found_title, i_found.verification_hint
       FROM claims c 
       JOIN matches m ON c.match_id = m.id 
       JOIN users u ON c.claimant_id = u.id
       JOIN items i_lost ON m.lost_item_id = i_lost.id
       JOIN items i_found ON m.found_item_id = i_found.id
       ORDER BY c.created_at DESC`
    );
    res.json(claims);
  } catch (err) {
    next(err);
  }
};

exports.updateClaimStatus = async (req, res, next) => {
  try {
    const { status, admin_note } = req.body;
    
    const [claims] = await db.execute('SELECT * FROM claims WHERE id = ?', [req.params.id]);
    if (claims.length === 0) return res.status(404).json({ error: 'Claim not found' });
    const claim = claims[0];
    
    await db.execute(
      'UPDATE claims SET status = ?, admin_note = ?, resolved_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, admin_note, req.params.id]
    );
    
    if (status === 'APPROVED') {
      const [matches] = await db.execute('SELECT * FROM matches WHERE id = ?', [claim.match_id]);
      const match = matches[0];
      
      // Update items
      await db.execute('UPDATE items SET status = "CLAIMED" WHERE id IN (?, ?)', [match.lost_item_id, match.found_item_id]);
      await db.execute('UPDATE matches SET status = "ACCEPTED" WHERE id = ?', [match.id]);
      
      // Notify claimant
      await db.execute(
        'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
        [claim.claimant_id, 'Claim Approved!', 'Your claim has been approved. You can now collect your item.', 'CLAIM_APPROVED']
      );
    } else if (status === 'REJECTED') {
      await db.execute(
        'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
        [claim.claimant_id, 'Claim Rejected', 'Unfortunately, your claim could not be verified.', 'CLAIM_REJECTED']
      );
    }
    
    res.json({ message: 'Claim updated successfully' });
  } catch (err) {
    next(err);
  }
};
