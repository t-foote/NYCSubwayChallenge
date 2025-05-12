const express = require('express');
const router = express.Router({ mergeParams: true });
const supabase = require('../utils/db');

// POST /attempts/:attemptId/stops_visited
router.post('/', async (req, res) => {
  const { attemptId } = req.params;
  const { stop_id, visitedat } = req.body;
  if (!stop_id || !visitedat) {
    return res.status(400).json({ error: 'stop_id and visitedat are required' });
  }
  try {
    // Check if already exists
    const { data: existing, error: selectError } = await supabase
      .from('stops_visited')
      .select('*')
      .eq('attempt_id', attemptId)
      .eq('stop_id', stop_id)
      .maybeSingle();
    if (selectError) throw selectError;
    if (existing) {
      return res.status(200).json(existing);
    }
    // Insert new
    const { data, error: insertError } = await supabase
      .from('stops_visited')
      .insert([{ stop_id, attempt_id: attemptId, visitedat }])
      .select()
      .maybeSingle();
    if (insertError) throw insertError;
    return res.status(201).json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /attempts/:attemptId/stops_visited
router.get('/', async (req, res) => {
  const { attemptId } = req.params;
  try {
    const { data, error } = await supabase
      .from('stops_visited')
      .select('*')
      .eq('attempt_id', attemptId)
      .order('visitedat', { ascending: true });
    if (error) throw error;
    return res.status(200).json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 