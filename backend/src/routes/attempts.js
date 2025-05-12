const express = require('express');
const router = express.Router();

// POST /attempts
router.post('/', async (req, res) => {
  // TODO: Implement start attempt logic
  res.status(501).json({ error: 'Not implemented' });
});

// GET /attempts/:attemptId
router.get('/:attemptId', async (req, res) => {
  // TODO: Implement get attempt logic
  res.status(501).json({ error: 'Not implemented' });
});

// PATCH /attempts/:attemptId
router.patch('/:attemptId', async (req, res) => {
  // TODO: Implement end attempt logic
  res.status(501).json({ error: 'Not implemented' });
});

module.exports = router; 