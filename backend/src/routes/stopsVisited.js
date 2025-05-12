const express = require('express');
const router = express.Router({ mergeParams: true });
const db = require('../utils/db');

// POST /attempts/:attemptId/stops_visited
router.post('/', async (req, res) => {
  const { attemptId } = req.params;
  const { stop_id, visitedat } = req.body;
  if (!stop_id || !visitedat) {
    return res.status(400).json({ error: 'stop_id and visitedat are required' });
  }
  try {
    // Check if already exists
    const existing = await db.query(
      'SELECT * FROM stops_visited WHERE attempt_id = $1 AND stop_id = $2',
      [attemptId, stop_id]
    );
    if (existing.rows.length > 0) {
      return res.status(200).json(existing.rows[0]);
    }
    // Insert new
    const result = await db.query(
      'INSERT INTO stops_visited (stop_id, attempt_id, visitedat) VALUES ($1, $2, $3) RETURNING *',
      [stop_id, attemptId, visitedat]
    );
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /attempts/:attemptId/stops_visited
router.get('/', async (req, res) => {
  const { attemptId } = req.params;
  try {
    const result = await db.query(
      'SELECT * FROM stops_visited WHERE attempt_id = $1 ORDER BY visitedat ASC',
      [attemptId]
    );
    return res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 