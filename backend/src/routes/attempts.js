const express = require('express');
const router = express.Router();
const supabase = require('../utils/db');

// POST /attempts
router.post('/', async (req, res) => {
  const { user_id } = req.body;
  if (!user_id) {
    return res.status(400).json({ error: 'user_id is required' });
  }
  try {
    const { data, error } = await supabase
      .from('attempts')
      .insert([{ user_id, started_at: new Date().toISOString() }])
      .select()
      .maybeSingle();
    if (error) throw error;
    return res.status(201).json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /attempts/:attemptId
router.get('/:attemptId', async (req, res) => {
  const { attemptId } = req.params;
  try {
    const { data, error } = await supabase
      .from('attempts')
      .select('*')
      .eq('id', attemptId)
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: 'Attempt not found' });
    }
    return res.status(200).json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /attempts/:attemptId
router.patch('/:attemptId', async (req, res) => {
  const { attemptId } = req.params;
  try {
    const { data, error } = await supabase
      .from('attempts')
      .update({ ended_at: new Date().toISOString() })
      .eq('id', attemptId)
      .select()
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: 'Attempt not found' });
    }
    return res.status(200).json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 