const express = require('express');
const router = express.Router();
const supabase = require('../utils/db');

// GET /transfers
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('transfers')
      .select('id, from_stop_id, to_stop_id, transfer_time_min, is_walking_transfer');
    if (error) throw error;
    res.status(200).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
