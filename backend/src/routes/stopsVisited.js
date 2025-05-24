const express = require('express');
const router = express.Router({ mergeParams: true });
const supabase = require('../utils/db');
const { getCurrentAttemptId } = require('../utils/attempts');

// POST /attempts/current/stops_visited
router.post('/', async (req, res) => {
  const deviceId = req.headers['x-device-id'];
  if (!deviceId) {
    return res.status(401).json({ error: 'Device ID required' });
  }

  const { stop_id, visited_at } = req.body;
  if (!stop_id || !visited_at) {
    return res.status(400).json({ error: 'stop_id and visited_at are required' });
  }

  try {
    const attemptId = await getCurrentAttemptId(deviceId);
    if (!attemptId) {
      return res.status(404).json({ error: 'No active attempt found' });
    }

    // Check if stop is already visited
    const { data: existing, error: checkError } = await supabase
      .from('stops_visited')
      .select('*')
      .eq('attempt_id', attemptId)
      .eq('stop_id', stop_id)
      .maybeSingle();

    if (checkError) throw checkError;

    if (existing) {
      return res.status(200).json(existing);
    }

    // Mark stop as visited
    const { data, error } = await supabase
      .from('stops_visited')
      .insert([{
        attempt_id: attemptId,
        stop_id,
        visited_at,
        pending: false
      }])
      .select()
      .single();

    if (error) throw error;
    return res.status(201).json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /attempts/current/stops_visited
router.get('/', async (req, res) => {
  const deviceId = req.headers['x-device-id'];
  if (!deviceId) {
    return res.status(401).json({ error: 'Device ID required' });
  }

  const page = parseInt(req.query.page) || 1;
  const pageSize = Math.min(parseInt(req.query.page_size) || 20, 100);

  try {
    const attemptId = await getCurrentAttemptId(deviceId);
    if (!attemptId) {
      return res.status(404).json({ error: 'No active attempt found' });
    }

    // Get total count
    const { count, error: countError } = await supabase
      .from('stops_visited')
      .select('*', { count: 'exact', head: true })
      .eq('attempt_id', attemptId);

    if (countError) throw countError;

    // Get paginated results
    const { data, error } = await supabase
      .from('stops_visited')
      .select(`
        *,
        stops (
          id,
          stop_name,
          nyct_stop_id
        )
      `)
      .eq('attempt_id', attemptId)
      .order('visited_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (error) throw error;

    return res.json({
      data,
      page,
      page_size: pageSize,
      total: count,
      has_more: count > page * pageSize
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 