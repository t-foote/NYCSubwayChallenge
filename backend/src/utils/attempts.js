const supabase = require('./db');

/**
 * Gets the current active attempt ID for a user
 * @param {string} deviceId - The device UUID
 * @returns {Promise<number|null>} The attempt ID or null if no active attempt
 */
async function getCurrentAttemptId(deviceId) {
  try {
    // First get the user ID from the device ID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('unique_device_uuid', deviceId)
      .single();

    if (userError) {
      console.error('Error finding user:', userError);
      return null;
    }

    if (!user) {
      return null;
    }

    // Then find the active attempt for this user
    const { data: attempt, error: attemptError } = await supabase
      .from('attempts')
      .select('id')
      .eq('user_id', user.id)
      .is('ended_at', null)
      .single();

    if (attemptError && attemptError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error finding attempt:', attemptError);
      return null;
    }

    return attempt?.id || null;
  } catch (error) {
    console.error('Error in getCurrentAttemptId:', error);
    return null;
  }
}

module.exports = {
  getCurrentAttemptId
}; 