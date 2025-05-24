const express = require('express');
const router = express.Router({ mergeParams: true });
const supabase = require('../utils/db');

// POST /users
router.post('/', async (req, res) => {
  const { unique_device_identifier } = req.body;
  if (!unique_device_identifier) {
    return res.status(400).json({ error: 'unique_device_identifier is required' });
  }
  try {
    // Check if user exists
    const { data: existing, error: selectError } = await supabase
      .from('users')
      .select('*')
      .eq('unique_device_uuid', unique_device_identifier)
      .maybeSingle();
    if (selectError) throw selectError;
    if (existing) {
      return res.status(200).json(existing);
    }
    // Create user
    const { data, error: insertError } = await supabase
      .from('users')
      .insert([{ unique_device_uuid: unique_device_identifier }])
      .select()
      .maybeSingle();
    if (insertError) throw insertError;
    return res.status(201).json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /users/:deviceId/current-attempt
router.get('/:deviceId/current-attempt', async (req, res) => {
  try {
    const { deviceId } = req.params;

    // First get the user ID from the device ID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('unique_device_identifier', deviceId)
      .single();

    if (userError) {
      return res.status(500).json({ error: 'Error finding user' });
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Then find the active attempt for this user
    const { data: attempt, error: attemptError } = await supabase
      .from('attempts')
      .select('id')
      .eq('user_id', user.id)
      .is('ended_at', null)
      .single();

    if (attemptError && attemptError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      return res.status(500).json({ error: 'Error finding attempt' });
    }

    // Return the attempt ID or null if no active attempt
    return res.json({ attempt_id: attempt?.id || null });
  } catch (error) {
    console.error('Error in getCurrentAttempt:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 