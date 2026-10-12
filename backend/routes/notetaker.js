const express = require('express');
const axios = require('axios');
const multer = require('multer');
const FormData = require('form-data');
const { Pool } = require('pg');
const { verifyToken } = require('../middleware/auth');
require('dotenv').config();

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// POST /api/notetaker/transcribe — upload audio, get transcript + classification, save to DB
router.post('/transcribe', verifyToken, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Audio file is required' });
  }

  let { case_id } = req.body;

  try {
    // Step 1: Forward audio to FastAPI for transcription + classification
    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    const mlResponse = await axios.post(
      `${process.env.ML_SERVICE_URL}/notetaker/transcribe`,
      formData,
      { headers: formData.getHeaders(), maxBodyLength: Infinity, maxContentLength: Infinity }
    );

    const { transcript, summary, action_items, important_dates, classified_breakdown } = mlResponse.data;

    let newCase = null;

    // Step 2: If no case was selected, auto-create one from the transcript's content
    if (!case_id) {
      const extractRes = await axios.post(`${process.env.ML_SERVICE_URL}/intake/extract`, { text: transcript });
      const entities = extractRes.data.entities;
      const clientName = entities.people[0] || 'Unknown';
      const caseTitle = entities.organizations[0]
        ? `${clientName} vs ${entities.organizations[0]}`
        : `Meeting — ${clientName}`;

      const caseResult = await pool.query(
        `INSERT INTO cases (title, client_name, case_type, status, created_by)
         VALUES ($1, $2, 'general', 'open', $3) RETURNING *`,
        [caseTitle, clientName, req.user.id]
      );
      newCase = caseResult.rows[0];
      case_id = newCase.id;

      // Notify dashboards in real time, same as intake does
      const io = req.app.get('io');
      io.emit('new_case', { case: newCase, document: null });
    }

    // Step 3: Save the meeting note, linked to either the existing or newly created case
    const result = await pool.query(
      `INSERT INTO meeting_notes (case_id, transcript, summary, action_items)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [case_id, transcript, summary, JSON.stringify(action_items)]
    );

    res.json({
      message: newCase ? 'Meeting transcribed and new case created' : 'Meeting transcribed and saved successfully',
      meeting_note: result.rows[0],
      new_case: newCase,
      important_dates,
      classified_breakdown,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Failed to process meeting audio', details: err.message });
  }
});

// GET /api/notetaker/notes — fetch meeting notes (own cases, or all for admin)
router.get('/notes', verifyToken, async (req, res) => {
  const isAdmin = req.user.role === 'admin';
  const { view } = req.query;
  const showAll = isAdmin && view === 'all';

  try {
    const query = showAll
      ? `SELECT m.*, c.title AS case_title FROM meeting_notes m
         LEFT JOIN cases c ON c.id = m.case_id
         ORDER BY m.created_at DESC`
      : `SELECT m.*, c.title AS case_title FROM meeting_notes m
         LEFT JOIN cases c ON c.id = m.case_id
         WHERE c.created_by = $1
         ORDER BY m.created_at DESC`;

    const result = showAll
      ? await pool.query(query)
      : await pool.query(query, [req.user.id]);

    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Failed to fetch meeting notes' });
  }
});

module.exports = router;