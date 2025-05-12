const express = require('express');
const router = express.Router();
const supabase = require('../utils/db');

// GET /stops
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('stops')
      .select('id, stop_name');
    if (error) throw error;
    res.status(200).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
