const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const env = require('../config/env');

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body || {};
    const cleanName = typeof name === 'string' ? name.trim() : '';
    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const cleanPhone = typeof phone === 'string' ? phone.trim() : '';

    if (!cleanName) return res.status(400).json({ error: 'Full name is required.' });
    if (cleanName.length > 255 || !/^[\p{L}][\p{L}\p{M} .'-]*$/u.test(cleanName)) {
      return res.status(400).json({ error: 'Enter a valid name using letters, spaces, apostrophes, periods, or hyphens.' });
    }
    if (!cleanEmail) return res.status(400).json({ error: 'Email is required.' });
    if (cleanEmail.length > 254 || !/^[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?)+$/i.test(cleanEmail)) {
      return res.status(400).json({ error: 'Enter a valid email address, for example name@campus.edu.' });
    }
    if (typeof password !== 'string' || !password) return res.status(400).json({ error: 'Password is required.' });
    if (password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
      return res.status(400).json({ error: 'Password must be at least 8 characters and no more than 72 bytes.' });
    }
    if (cleanPhone && (cleanPhone.length > 50 || !/^\+?[0-9() .-]{7,20}$/.test(cleanPhone))) {
      return res.status(400).json({ error: 'Enter a valid phone number, or leave the field blank.' });
    }

    const [existing] = await db.execute('SELECT id FROM users WHERE email = ?', [cleanEmail]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists. Sign in instead, or use a different email.' });
    }
    
    const hash = await bcrypt.hash(password, 10);
    // Public registration must never grant admin privileges.
    const userRole = 'STUDENT';
    
    let result;
    try {
      [result] = await db.execute(
        'INSERT INTO users (name, email, password_hash, phone, role) VALUES (?, ?, ?, ?, ?)',
        [cleanName, cleanEmail, hash, cleanPhone || null, userRole]
      );
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'An account with this email already exists. Sign in instead, or use a different email.' });
      }
      throw err;
    }
    
    res.status(201).json({ id: result.insertId, name: cleanName, email: cleanEmail, role: userRole });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (!cleanEmail) return res.status(400).json({ error: 'Email is required.' });
    if (typeof password !== 'string' || !password) return res.status(400).json({ error: 'Password is required.' });
    
    const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [cleanEmail]);
    if (users.length === 0) {
      return res.status(401).json({ error: 'No account was found for this email. Check it or register first.' });
    }
    
    const user = users[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Incorrect password. Please try again.' });
    }
    
    const token = jwt.sign({ id: user.id, role: user.role }, env.JWT_SECRET, { expiresIn: '1d' });
    
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    // Assuming authMiddleware sets req.user
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const [users] = await db.execute('SELECT id, name, email, phone, role FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(users[0]);
  } catch (err) {
    next(err);
  }
};
