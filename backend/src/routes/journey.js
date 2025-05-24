const express = require('express');
const router = express.Router({ mergeParams: true });
const supabase = require('../utils/db');
const { getCurrentAttemptId } = require('../utils/attempts');
const axios = require('axios');

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
    return res.status(401).json({ error: 'Device ID required' });
  }

  try {
    const attemptId = await getCurrentAttemptId(deviceId);
    if (!attemptId) {
      return res.status(404).json({ error: 'No active attempt found' });
    }

    // Get visited stops for this attempt
    const { data: visitedStops, error: visitedError } = await supabase
      .from('stops_visited')
      .select('stops(nyct_stop_id)')
      .eq('attempt_id', attemptId);

    if (visitedError) throw visitedError;

    // Convert to list of stop IDs
    const visitedStopIds = visitedStops.map(vs => vs.stops.nyct_stop_id);

    // Call Python microservice to get optimal route
    console.log('Calling pathfinder service with visited stops:', visitedStopIds);
    let pathfinderResponse;
    try {
      pathfinderResponse = await axios.get(
        `${process.env.PATHFINDER_URL}/calculate-route`,
        {
          params: {
            stop_ids_already_visited: visitedStopIds.join(',')
          }
        }
      );
      console.log('Raw pathfinder response:', {
        status: pathfinderResponse.status,
        statusText: pathfinderResponse.statusText,
        headers: pathfinderResponse.headers,
        data: pathfinderResponse.data
      });
    } catch (error) {
      console.error('Error calling pathfinder service:', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      return res.status(500).json({ 
        error: 'Failed to calculate optimal route',
        details: error.response?.data || error.message
      });
    }

    if (!pathfinderResponse?.data) {
      console.error('Pathfinder service returned no data');
      return res.status(500).json({ 
        error: 'Invalid response from pathfinder service',
        details: 'No data received'
      });
    }

    console.log('Pathfinder response:', pathfinderResponse.data);
    const { segments, total_travel_time } = pathfinderResponse.data;

    if (!segments || !Array.isArray(segments)) {
      console.error('Invalid segments data from pathfinder:', pathfinderResponse.data);
      return res.status(500).json({ 
        error: 'Invalid response from pathfinder service',
        details: 'No segments found in response'
      });
    }

    // Store segments in the database
    for (const segment of segments) {
      console.log('Processing segment:', segment);
      // Get database IDs for the stops and trip
      const { data: fromStop, error: fromError } = await supabase
        .from('stops')
        .select('id')
        .eq('nyct_stop_id', segment.start_stop_id)
        .single();
      
      if (fromError || !fromStop) {
        console.error('Unknown from_stop_id:', segment.start_stop_id, 'not found in stops table.');
        return res.status(400).json({ error: `Unknown from_stop_id: ${segment.start_stop_id}` });
      }
      
      const { data: toStop, error: toError } = await supabase
        .from('stops')
        .select('id')
        .eq('nyct_stop_id', segment.end_stop_id)
        .single();
      
      if (toError || !toStop) {
        console.error('Unknown to_stop_id:', segment.end_stop_id, 'not found in stops table.');
        return res.status(400).json({ error: `Unknown to_stop_id: ${segment.end_stop_id}` });
      }
      
      const { data: trip, error: tripError } = await supabase
        .from('trips_scheduled')
        .select('id')
        .eq('nyct_trip_id', segment.mta_trip.trip_id)
        .single();

      if (tripError) {
        console.error('Error fetching trip:', { 
          nyct_trip_id: segment.mta_trip.trip_id,
          error: tripError 
        });
        continue;
      }

      console.log('Found IDs:', { 
        from_stop_id: fromStop.id,
        to_stop_id: toStop.id,
        trip_id: trip.id
      });

      // Insert the segment
      const { error: insertError } = await supabase
        .from('segment')
        .insert({
          attempt_id: attemptId,
          trip_id: trip.id,
          from_stop_id: fromStop.id,
          to_stop_id: toStop.id
        });

      if (insertError) {
        console.error('Error inserting segment:', {
          attempt_id: attemptId,
          trip_id: trip.id,
          from_stop_id: fromStop.id,
          to_stop_id: toStop.id,
          error: insertError
        });
      } else {
        console.log('Successfully inserted segment');
      }
    }

    // Return the journey data to the client
    return res.status(200).json({
      segments: segments,
      total_travel_time: total_travel_time,
      segments_stored: segments.length
    });

  } catch (err) {
    console.error('Error getting journey:', {
      error: err,
      message: err.message,
      stack: err.stack,
      response: err.response?.data
    });
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
      pathfinder_error: err.response?.data
    });
  }
});

module.exports = router; 