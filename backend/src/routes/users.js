const express = require('express');
const router = express.Router();
const db = require('../utils/db');

// POST /users
router.post('/', async (req, res) => {
  const { unique_device_identifier } = req.body;
  if (!unique_device_identifier) {
    return res.status(400).json({ error: 'unique_device_identifier is required' });
  }
  try {
    // Check if user exists
    const existing = await db.query(
      'SELECT * FROM users WHERE unique_device_identifier = $1',
      [unique_device_identifier]
    );
    if (existing.rows.length > 0) {
      return res.status(200).json(existing.rows[0]);
    }
    // Create user
    const result = await db.query(
      'INSERT INTO users (unique_device_identifier) VALUES ($1) RETURNING *',
      [unique_device_identifier]
    );
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 