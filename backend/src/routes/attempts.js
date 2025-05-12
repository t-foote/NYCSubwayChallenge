const express = require('express');
const router = express.Router();
const db = require('../utils/db');

// POST /attempts
router.post('/', async (req, res) => {
  const { user_id } = req.body;
  if (!user_id) {
    return res.status(400).json({ error: 'user_id is required' });
  }
  try {
    const result = await db.query(
      'INSERT INTO attempts (user_id, started_at) VALUES ($1, NOW()) RETURNING *',
      [user_id]
    );
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /attempts/:attemptId
router.get('/:attemptId', async (req, res) => {
  const { attemptId } = req.params;
  try {
    const result = await db.query('SELECT * FROM attempts WHERE id = $1', [attemptId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Attempt not found' });
    }
    return res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /attempts/:attemptId
router.patch('/:attemptId', async (req, res) => {
  const { attemptId } = req.params;
  try {
    const result = await db.query(
      'UPDATE attempts SET ended_at = NOW() WHERE id = $1 RETURNING *',
      [attemptId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Attempt not found' });
    }
    return res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 