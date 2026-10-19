const db = require('../config/db');

exports.getDashboardStats = async (req, res, next) => {
  try {
    const [totalItems] = await db.execute('SELECT COUNT(*) as c FROM items');
    const [lostItems] = await db.execute('SELECT COUNT(*) as c FROM items WHERE type = "LOST"');
    const [foundItems] = await db.execute('SELECT COUNT(*) as c FROM items WHERE type = "FOUND"');
    const [potentialMatches] = await db.execute('SELECT COUNT(*) as c FROM matches WHERE status = "PENDING"');
    const [pendingClaims] = await db.execute('SELECT COUNT(*) as c FROM claims WHERE status = "PENDING"');
    const [resolvedClaims] = await db.execute('SELECT COUNT(*) as c FROM claims WHERE status = "APPROVED"');
    
    // Simple bar chart data: items reported in the last 7 days
    const [recentItems] = await db.execute(`
      SELECT DATE(created_at) as date, COUNT(*) as count 
      FROM items 
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);
    
    res.json({
      total: totalItems[0].c,
      lost: lostItems[0].c,
      found: foundItems[0].c,
      potential_matches: potentialMatches[0].c,
      pending_claims: pendingClaims[0].c,
      resolved: resolvedClaims[0].c,
      chart_data: recentItems
    });
  } catch (err) {
    next(err);
  }
};
