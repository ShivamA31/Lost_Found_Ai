const db = require('../config/db');
const axios = require('axios');
const env = require('../config/env');

exports.getSummary = async (req, res, next) => {
  try {
    const [[counts]] = await db.execute(`
      SELECT COUNT(*) AS reports,
             SUM(type = 'LOST') AS lost,
             SUM(type = 'FOUND') AS found
      FROM items WHERE status = 'ACTIVE'
    `);
    const [[matches]] = await db.execute("SELECT COUNT(*) AS count FROM matches WHERE status = 'PENDING'");
    let aiStatus = 'offline';
    try {
      await axios.get(`${env.AI_SERVICE_URL}/health`, { timeout: 2500 });
      aiStatus = 'online';
    } catch {
      // Keep the public summary available when the optional AI service is down.
    }
    res.json({
      reports: Number(counts.reports || 0),
      lost: Number(counts.lost || 0),
      found: Number(counts.found || 0),
      potentialMatches: Number(matches.count || 0),
      aiStatus
    });
  } catch (err) {
    next(err);
  }
};

exports.getCategories = async (req, res, next) => {
  try {
    const [categories] = await db.execute('SELECT * FROM categories ORDER BY name');
    res.json(categories);
  } catch (err) {
    next(err);
  }
};

exports.getLocations = async (req, res, next) => {
  try {
    const [locations] = await db.execute('SELECT * FROM locations ORDER BY name');
    res.json(locations);
  } catch (err) {
    next(err);
  }
};
