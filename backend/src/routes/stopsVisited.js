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
        visitedat: visited_at,
        pending: false
      }])
      .select()
      .single();

    if (error) throw error;
    return res.status(201).json(data);
  } catch (err) {
    console.error('Error marking stop as visited:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /attempts/current/stops_visited
router.get('/', async (req, res) => {
  const deviceId = req.headers['x-device-id'];
  if (!deviceId) {
    console.error('Stops visited request received without device ID');
    return res.status(401).json({ error: 'Device ID required' });
  }

  const page = parseInt(req.query.page) || 1;
  const pageSize = Math.min(parseInt(req.query.page_size) || 20, 100);

  try {
    console.log('Getting current attempt ID for device:', deviceId);
    const attemptId = await getCurrentAttemptId(deviceId);
    
    if (!attemptId) {
      console.log('No active attempt found for device:', deviceId);
      return res.status(200).json({
        data: [],
        page,
        page_size: pageSize,
        total: 0,
        has_more: false
      });
    }

    console.log('Found active attempt:', attemptId);

    // Get total count
    const { count, error: countError } = await supabase
      .from('stops_visited')
      .select('*', { count: 'exact', head: true })
      .eq('attempt_id', attemptId);

    if (countError) {
      console.error('Error getting stops visited count:', {
        error: countError,
        message: countError.message,
        details: countError.details,
        hint: countError.hint,
        code: countError.code
      });
      throw countError;
    }

    // If no stops visited, return empty result
    if (!count) {
      console.log('No stops visited for attempt:', attemptId);
      return res.status(200).json({
        data: [],
        page,
        page_size: pageSize,
        total: 0,
        has_more: false
      });
    }

    // Get paginated results
    const { data, error } = await supabase
      .from('stops_visited')
      .select(`
        id,
        stop_id,
        attempt_id,
        visitedat,
        stops (
          id,
          stop_name,
          nyct_stop_id
        )
      `)
      .eq('attempt_id', attemptId)
      .order('visitedat', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (error) {
      console.error('Error getting stops visited data:', {
        error,
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw error;
    }

    console.log('Successfully retrieved stops visited:', {
      attemptId,
      count: count || 0,
      dataLength: data?.length || 0,
      page,
      pageSize
    });

    return res.json({
      data: data || [],
      page,
      page_size: pageSize,
      total: count || 0,
      has_more: (count || 0) > page * pageSize
    });
  } catch (err) {
    console.error('Error in stops visited GET endpoint:', {
      error: err,
      message: err.message,
      code: err.code,
      details: err.details,
      hint: err.hint,
      deviceId,
      stack: err.stack
    });
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

module.exports = router; 