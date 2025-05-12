const express = require('express');
const router = express.Router();
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

module.exports = router; 