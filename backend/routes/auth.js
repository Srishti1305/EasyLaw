const express = require('express');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
require('dotenv').config();

const router = express.Router();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  const { name, email, password, bar_council_number, firm_name } = req.body;

  if (!name || !email || !password || !bar_council_number) {
    return res.status(400).json({ error: 'name, email, password, and bar_council_number are required' });
  }

  try {
    // Check if email already exists
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, bar_council_number, firm_name, verification_status)
       VALUES ($1, $2, $3, 'associate', $4, $5, 'pending')
       RETURNING id, name, email, verification_status, created_at`,
      [name, email, password_hash, bar_council_number, firm_name || null]
    );

    res.status(201).json({
      message: 'Account created. Awaiting verification before you can log in.',
      user: result.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Signup failed', details: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check verification status before allowing login
    if (user.verification_status === 'pending') {
      return res.status(403).json({ error: 'Your account is still pending verification.' });
    }
    if (user.verification_status === 'rejected') {
      return res.status(403).json({ error: 'Your account was not approved.', reason: user.rejection_reason });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Login failed', details: err.message });
  }
});

// GET /api/auth/pending → list all pending lawyers (for admin panel)
router.get('/pending', verifyToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, bar_council_number, firm_name, created_at
       FROM users WHERE verification_status = 'pending' ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch pending users' });
  }
});

// POST /api/auth/verify/:id → approve or reject a lawyer
router.post('/verify/:id', verifyToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { decision, reason } = req.body; // decision: 'verified' or 'rejected'

  if (!['verified', 'rejected'].includes(decision)) {
    return res.status(400).json({ error: "decision must be 'verified' or 'rejected'" });
  }

  try {
    const result = await pool.query(
      `UPDATE users SET verification_status = $1, rejection_reason = $2
       WHERE id = $3 RETURNING id, name, email, verification_status`,
      [decision, decision === 'rejected' ? reason || 'Not specified' : null, id]
    );
    res.json({ message: `User ${decision}`, user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Verification update failed' });
  }
});

module.exports = router;