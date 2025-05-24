const express = require('express');
const router = express.Router({ mergeParams: true });
const supabase = require('../utils/db');

// POST /users
router.post('/', async (req, res) => {
  console.log('Received user registration request:', {
    body: req.body,
    headers: req.headers
  });

  if (!req.body.unique_device_identifier) {
    console.error('User registration failed: Missing unique_device_identifier in request body');
    return res.status(400).json({ error: 'unique_device_identifier is required' });
  }

  try {
    // Check if user exists
    const { data: existing, error: selectError } = await supabase
      .from('users')
      .select('*')
      .eq('unique_device_uuid', req.body.unique_device_identifier)
      .maybeSingle();
    if (selectError) throw selectError;
    if (existing) {
      return res.status(200).json(existing);
    }
    // Create user
    const { data, error } = await supabase
      .from('users')
      .insert([{ unique_device_uuid: req.body.unique_device_identifier }])
      .select()
      .single();

    if (error) {
      console.error('Database error during user registration:', {
        error,
        deviceId: req.body.unique_device_identifier
      });
      throw error;
    }

    console.log('Successfully registered user:', {
      userId: data.id,
      deviceId: data.unique_device_uuid
    });
    return res.status(201).json(data);
  } catch (err) {
    console.error('Error in user registration:', {
      error: err,
      deviceId: req.body.unique_device_identifier,
      stack: err.stack
    });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;