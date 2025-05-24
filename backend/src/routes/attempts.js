const express = require('express');
const router = express.Router();
const supabase = require('../utils/db');
const { getCurrentAttemptId } = require('../utils/attempts');

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

// GET /attempts/current
router.get('/current', async (req, res) => {
  const deviceId = req.headers['x-device-id'];
  if (!deviceId) {
    return res.status(401).json({ error: 'Device ID required' });
  }

  try {
    const attemptId = await getCurrentAttemptId(deviceId);
    if (!attemptId) {
      return res.status(404).json({ error: 'No active attempt found' });
    }

    const { data, error } = await supabase
      .from('attempts')
      .select('*')
      .eq('id', attemptId)
      .single();

    if (error) throw error;
    return res.status(200).json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /attempts/current
router.patch('/current', async (req, res) => {
  const deviceId = req.headers['x-device-id'];
  if (!deviceId) {
    return res.status(401).json({ error: 'Device ID required' });
  }

  try {
    const attemptId = await getCurrentAttemptId(deviceId);
    if (!attemptId) {
      return res.status(404).json({ error: 'No active attempt found' });
    }

    const { data, error } = await supabase
      .from('attempts')
      .update({ ended_at: new Date().toISOString() })
      .eq('id', attemptId)
      .select()
      .single();

    if (error) throw error;
    return res.status(200).json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 