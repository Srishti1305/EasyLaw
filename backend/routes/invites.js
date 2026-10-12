const express = require('express');
const crypto = require('crypto');
const axios = require('axios');
const { Pool } = require('pg');
const { verifyToken } = require('../middleware/auth');
require('dotenv').config();

const router = express.Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const CASE_TYPES = ['civil', 'criminal', 'family', 'property', 'corporate', 'consumer', 'labour', 'other'];

// POST /api/invites → lawyer creates a one-time invite link (valid 7 days)
router.post('/invites', verifyToken, async (req, res) => {
  try {
    const token = crypto.randomBytes(24).toString('hex');
    const result = await pool.query(
      `INSERT INTO intake_invites (token, lawyer_id, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '7 days')
       RETURNING token, expires_at`,
      [token, String(req.user.id)]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Failed to create invite' });
  }
});

// GET /api/public/invite/:token → public: is this link still valid?
router.get('/public/invite/:token', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT i.status, i.expires_at, u.name AS lawyer_name
       FROM intake_invites i
       LEFT JOIN users u ON u.id::text = i.lawyer_id
       WHERE i.token = $1`,
      [req.params.token]
    );
    const inv = result.rows[0];
    if (!inv) return res.status(404).json({ error: 'This link is not valid.' });
    if (inv.status !== 'pending') return res.status(410).json({ error: 'This form has already been submitted.' });
    if (new Date(inv.expires_at) < new Date()) return res.status(410).json({ error: 'This link has expired.' });
    res.json({ lawyer_name: inv.lawyer_name || 'your lawyer' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// POST /api/public/invite/:token → public: client submits the form
router.post('/public/invite/:token', async (req, res) => {
  const { client_name, client_phone, client_address, client_aadhaar, opponent_name, case_type, text } = req.body;

  if (!client_name || !client_name.trim()) {
    return res.status(400).json({ error: 'Your name is required' });
  }
  const phone = (client_phone || '').replace(/\D/g, '');
  if (phone && phone.length !== 10) {
    return res.status(400).json({ error: 'Mobile number must be 10 digits' });
  }
  const aadhaarDigits = (client_aadhaar || '').replace(/\D/g, '');
  if (aadhaarDigits && aadhaarDigits.length !== 12) {
    return res.status(400).json({ error: 'Aadhaar must be 12 digits' });
  }
  const aadhaarLast4 = aadhaarDigits ? aadhaarDigits.slice(-4) : null;
  const caseType = CASE_TYPES.includes(case_type) ? case_type : 'other';
  const description = (text || '').trim().slice(0, 5000);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Claim the invite atomically: works only once, only if not expired
    const claim = await client.query(
      `UPDATE intake_invites SET status = 'used'
       WHERE token = $1 AND status = 'pending' AND expires_at > NOW()
       RETURNING lawyer_id`,
      [req.params.token]
    );
    if (claim.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(410).json({ error: 'This link is invalid, expired or already used.' });
    }
    const lawyerId = claim.rows[0].lawyer_id;

    // Optional entity extraction; never block the client if the ML service is down
    let entities = { people: [], organizations: [], dates: [], locations: [], money: [], misc: [] };
    if (description) {
      try {
        const ml = await axios.post(`${process.env.ML_SERVICE_URL}/intake/extract`, { text: description }, { timeout: 15000 });
        entities = ml.data.entities;
      } catch (e) {
        console.error('ML extraction skipped:', e.message);
      }
    }

    const caseTitle = opponent_name && opponent_name.trim()
      ? `${client_name.trim()} vs ${opponent_name.trim()}`
      : client_name.trim();

    const caseResult = await client.query(
      `INSERT INTO cases
         (title, client_name, client_phone, client_address, client_aadhaar_last4,
          opponent_name, case_type, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'open', $8) RETURNING *`,
      [
        caseTitle,
        client_name.trim(),
        phone || null,
        client_address ? client_address.trim().slice(0, 500) : null,
        aadhaarLast4,
        opponent_name ? opponent_name.trim() : null,
        caseType,
        lawyerId,
      ]
    );
    const newCase = caseResult.rows[0];

    const content = description ||
      `Submitted by client via intake link.\nClient: ${client_name.trim()}\nOpponent: ${opponent_name || '-'}\nCase type: ${caseType}`;
    const docResult = await client.query(
      `INSERT INTO documents (case_id, title, content, doc_type)
       VALUES ($1, $2, $3, 'intake') RETURNING *`,
      [newCase.id, 'Client Intake Submission', content]
    );

    await client.query(`UPDATE intake_invites SET case_id = $1 WHERE token = $2`, [String(newCase.id), req.params.token]);
    await client.query('COMMIT');

    const io = req.app.get('io');
    io.emit('new_case', { case: newCase, document: docResult.rows[0] });

    res.json({ message: 'Thank you. Your details have been sent to your lawyer.' });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error(err.message);
    res.status(500).json({ error: 'Could not submit the form. Please try again.' });
  } finally {
    client.release();
  }
});

module.exports = router;