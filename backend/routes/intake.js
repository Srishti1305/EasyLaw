const express = require('express');
const axios = require('axios');
const { verifyToken } = require('../middleware/auth');
const { Pool } = require('pg');
require('dotenv').config();

const router = express.Router();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// POST /api/intake  → structured client details + optional free text, saved to DB
router.post('/intake', verifyToken, async (req, res) => {
  const {
    title, text,
    client_name, client_phone, client_address, client_aadhaar,
    opponent_name, case_type,
  } = req.body;

  if (!client_name || !client_name.trim()) {
    return res.status(400).json({ error: 'Client name is required' });
  }

  // Validate phone (10 digits) if given
  const phone = (client_phone || '').replace(/\D/g, '');
  if (phone && phone.length !== 10) {
    return res.status(400).json({ error: 'Mobile number must be 10 digits' });
  }

  // Aadhaar: accept 12 digits, store ONLY the last 4 (masked)
  const aadhaarDigits = (client_aadhaar || '').replace(/\D/g, '');
  if (aadhaarDigits && aadhaarDigits.length !== 12) {
    return res.status(400).json({ error: 'Aadhaar must be 12 digits' });
  }
  const aadhaarLast4 = aadhaarDigits ? aadhaarDigits.slice(-4) : null;

  const allowedTypes = ['civil', 'criminal', 'family', 'property', 'corporate', 'consumer', 'labour', 'other'];
  const caseType = allowedTypes.includes(case_type) ? case_type : 'other';

  try {
    // Step 1: extract entities from the free-text description (if provided)
    let entities = { people: [], organizations: [], dates: [], locations: [], money: [], misc: [] };
    if (text && text.trim()) {
      const mlResponse = await axios.post(`${process.env.ML_SERVICE_URL}/intake/extract`, { text });
      entities = mlResponse.data.entities;
    }

    // Step 2: create the case from the structured fields
    const caseTitle = (title && title.trim())
      || (opponent_name ? `${client_name.trim()} vs ${opponent_name.trim()}` : client_name.trim());

    const caseResult = await pool.query(
      `INSERT INTO cases
         (title, client_name, client_phone, client_address, client_aadhaar_last4,
          opponent_name, case_type, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'open', $8) RETURNING *`,
      [
        caseTitle,
        client_name.trim(),
        phone || null,
        client_address ? client_address.trim() : null,
        aadhaarLast4,
        opponent_name ? opponent_name.trim() : null,
        caseType,
        req.user.id,
      ]
    );
    const newCase = caseResult.rows[0];

    // Step 3: save the intake as a document linked to the case
    const content = (text && text.trim()) ||
      `Client: ${client_name.trim()}\nOpponent: ${opponent_name || '-'}\nCase type: ${caseType}`;
    const docResult = await pool.query(
      `INSERT INTO documents (case_id, title, content, doc_type)
       VALUES ($1, $2, $3, 'intake') RETURNING *`,
      [newCase.id, 'Intake Form Submission', content]
    );

    // Notify connected dashboards in real time
    const io = req.app.get('io');
    io.emit('new_case', { case: newCase, document: docResult.rows[0] });

    res.json({
      message: 'Intake processed successfully',
      case: newCase,
      document: docResult.rows[0],
      extracted_entities: entities,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Failed to process intake', details: err.message });
  }
});
// GET /api/cases → fetch all cases with their document counts
router.get('/cases', verifyToken, async (req, res) => {
  const { view } = req.query; // 'all' or 'mine'
  const isAdmin = req.user.role === 'admin';
  const showAll = isAdmin && view === 'all';

  try {
    const query = showAll
      ? `SELECT c.id, c.title, c.client_name, c.case_type, c.status, c.created_at,
                u.name AS lawyer_name,
                COUNT(d.id)::int AS document_count
         FROM cases c
         LEFT JOIN documents d ON d.case_id = c.id
         LEFT JOIN users u ON u.id = c.created_by
         GROUP BY c.id, u.name
         ORDER BY c.created_at DESC`
      : `SELECT c.id, c.title, c.client_name, c.case_type, c.status, c.created_at,
                COUNT(d.id)::int AS document_count
         FROM cases c
         LEFT JOIN documents d ON d.case_id = c.id
         WHERE c.created_by = $1
         GROUP BY c.id
         ORDER BY c.created_at DESC`;

    const result = showAll
      ? await pool.query(query)
      : await pool.query(query, [req.user.id]);

    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Failed to fetch cases' });
  }
});

// GET /api/stats → summary counts for dashboard header
router.get('/stats', verifyToken, async (req, res) => {
  const { view } = req.query;
  const isAdmin = req.user.role === 'admin';
  const showAll = isAdmin && view === 'all';
  const filter = showAll ? '' : 'WHERE created_by = $1';
  const params = showAll ? [] : [req.user.id];

  try {
    const casesCount = await pool.query(`SELECT COUNT(*)::int FROM cases ${filter}`, params);
    const openCount = await pool.query(
      `SELECT COUNT(*)::int FROM cases ${filter}${filter ? ' AND' : 'WHERE'} status = 'open'`,
      params
    );
    const docsQuery = showAll
      ? `SELECT COUNT(*)::int FROM documents`
      : `SELECT COUNT(*)::int FROM documents d JOIN cases c ON c.id = d.case_id WHERE c.created_by = $1`;
    const docsCount = await pool.query(docsQuery, showAll ? [] : [req.user.id]);

    res.json({
      total_cases: casesCount.rows[0].count,
      total_documents: docsCount.rows[0].count,
      open_cases: openCount.rows[0].count,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});
// DELETE /api/cases/:id → delete a case and everything attached to it
router.delete('/cases/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const isAdmin = req.user.role === 'admin';
  const client = await pool.connect();

  try {
    // Only the owner (or an admin) may delete
    const found = await client.query(
      `SELECT id, created_by FROM cases WHERE id = $1`,
      [id]
    );
    if (found.rows.length === 0) {
      return res.status(404).json({ error: 'Case not found' });
    }
    if (!isAdmin && found.rows[0].created_by !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own cases' });
    }

    await client.query('BEGIN');
    await client.query(`DELETE FROM meeting_notes WHERE case_id = $1`, [id]);
    await client.query(`DELETE FROM documents WHERE case_id = $1`, [id]);
    await client.query(`DELETE FROM cases WHERE id = $1`, [id]);
    await client.query('COMMIT');

    res.json({ message: 'Case deleted', id });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error(err.message);
    res.status(500).json({ error: 'Failed to delete case', details: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;