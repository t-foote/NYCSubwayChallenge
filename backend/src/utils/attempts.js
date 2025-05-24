const supabase = require('./db');

/**
 * Gets the current active attempt ID for a user
 * @param {string} deviceId - The device UUID
 * @returns {Promise<number|null>} The attempt ID or null if no active attempt
 */
async function getCurrentAttemptId(deviceId) {
  try {
    // Get user ID from device ID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('unique_device_uuid', deviceId)
      .single();

    if (userError) throw userError;
    if (!user) {
      console.error(`No user found for device ID: ${deviceId}`);
      return null;
    }

    // Get current attempt
    const { data: attempt, error: attemptError } = await supabase
      .from('attempts')
      .select('id')
      .eq('user_id', user.id)
      .is('ended_at', null)
      .single();

    if (attemptError) {
      if (attemptError.code === 'PGRST116') {
        console.error(`No active attempt found for device ID: ${deviceId} (user ID: ${user.id})`);
      } else {
        throw attemptError;
      }
    }

    return attempt?.id || null;
  } catch (err) {
    console.error('Error getting current attempt ID:', err);
    throw err;
  }
}

module.exports = {
  getCurrentAttemptId
}; 