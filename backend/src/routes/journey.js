const express = require('express');
const router = express.Router({ mergeParams: true });
const supabase = require('../utils/db');
const { getCurrentAttemptId } = require('../utils/attempts');

// POST /attempts/current/journey
router.post('/', async (req, res) => {
  const deviceId = req.headers['x-device-id'];
  if (!deviceId) {
    console.error('Journey generation request received without device ID');
    return res.status(401).json({ error: 'Device ID required' });
  }

  try {
    const attemptId = await getCurrentAttemptId(deviceId);
    if (!attemptId) {
      console.error(`Journey generation request received for device ${deviceId} with no active attempt`);
      return res.status(404).json({ error: 'No active attempt found' });
    }

    // TODO: Call pathfinding service to generate journey
    // For now, return a placeholder response
    return res.status(202).json({
      status: 'pending',
      message: 'Journey generation started'
    });
  } catch (err) {
    console.error('Error generating journey:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /attempts/current/journey
router.get('/', async (req, res) => {
  const deviceId = req.headers['x-device-id'];
  if (!deviceId) {
    console.error('Journey request received without device ID');
    return res.status(401).json({ error: 'Device ID required' });
  }

  try {
    const attemptId = await getCurrentAttemptId(deviceId);
    if (!attemptId) {
      console.error(`Journey request received for device ${deviceId} with no active attempt`);
      return res.status(404).json({ error: 'No active attempt found' });
    }

    // Get journey segments
    const { data, error } = await supabase
      .from('journey_segments')
      .select(`
        *,
        from_stop:from_stop_id (id, stop_name, nyct_stop_id),
        to_stop:to_stop_id (id, stop_name, nyct_stop_id)
      `)
      .eq('attempt_id', attemptId)
      .order('id', { ascending: true });

    if (error) throw error;

    if (!data || data.length === 0) {
      console.error(`No journey segments found for attempt ${attemptId}`);
      return res.status(404).json({ error: 'Journey not found' });
    }

    return res.status(200).json({
      attempt_id: attemptId,
      segments: data
    });
  } catch (err) {
    console.error('Error retrieving journey:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 