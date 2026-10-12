const express = require('express');
const axios = require('axios');
const { verifyToken } = require('../middleware/auth');
const { Pool } = require('pg');
require('dotenv').config();

const router = express.Router();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// POST /api/intake  → takes raw text, calls ML service, saves to DB
router.post('/intake', verifyToken, async (req, res) => {
  const { text, title } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'text is required' });
  }

  try {
    // Step 1: Call the ML service to extract entities
    const mlResponse = await axios.post(`${process.env.ML_SERVICE_URL}/intake/extract`, { text });
    const entities = mlResponse.data.entities;

    // Step 2: Create a case record using extracted info
    const clientName = entities.people[0] || 'Unknown';
    const caseResult = await pool.query(
     `INSERT INTO cases (title, client_name, case_type, status, created_by)
      VALUES ($1, $2, $3, 'open', $4) RETURNING *`,
     [title || 'Untitled Intake', clientName, 'general', req.user.id]
    );   

    const newCase = caseResult.rows[0];

    // Step 3: Save the raw intake text as a document linked to that case
    const docResult = await pool.query(
      `INSERT INTO documents (case_id, title, content, doc_type)
       VALUES ($1, $2, $3, 'intake') RETURNING *`,
      [newCase.id, 'Intake Form Submission', text]
    );
    // Notify all connected dashboards in real time
    const io = req.app.get('io');
    io.emit('new_case', { case: newCase, document: docResult.rows[0] });
    
    res.json({
      message: 'Intake processed successfully',
      case: newCase,
      document: docResult.rows[0],
      extracted_entities: entities
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

module.exports = router;