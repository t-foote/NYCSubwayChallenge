const express = require('express');
const router = express.Router({ mergeParams: true });

// POST /attempts/:attemptId/stops_visited
router.post('/', async (req, res) => {
  // TODO: Implement mark stop as visited logic
  res.status(501).json({ error: 'Not implemented' });
});

// GET /attempts/:attemptId/stops_visited
router.get('/', async (req, res) => {
  // TODO: Implement get visited stops logic
  res.status(501).json({ error: 'Not implemented' });
});

module.exports = router; 