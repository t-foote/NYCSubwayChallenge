const express = require('express');
const router = express.Router();

// POST /users
router.post('/', async (req, res) => {
  // TODO: Implement user registration logic
  res.status(501).json({ error: 'Not implemented' });
});

module.exports = router; 