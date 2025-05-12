const express = require('express');
const router = express.Router();
const supabase = require('../utils/db');

// GET /routes
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('routes')
      .select('id, route_id, route_name');
    if (error) throw error;
    res.status(200).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
