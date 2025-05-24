import { API_BASE_URL } from "./config";
import { getDeviceId } from "../utils/deviceId";

async function authenticatedFetch(endpoint: string, options: RequestInit = {}) {
  try {
    const deviceId = getDeviceId();
    console.log(`Making API request to ${endpoint}:`, {
      deviceId,
      method: options.method || 'GET',
      headers: options.headers
    });

    const headers = {
      "Content-Type": "application/json",
      "X-Device-ID": deviceId,
      ...options.headers,
    };

    const url = `${API_BASE_URL}${endpoint}`;
    console.log('Full request URL:', url);

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API request failed for ${endpoint}:`, {
        status: response.status,
        statusText: response.statusText,
        responseBody: errorText,
        url,
        headers: response.headers
      });
      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`API request successful for ${endpoint}:`, {
      status: response.status,
      data
    });
    return data;
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, {
      error,
      message: error.message,
      stack: error.stack,
      endpoint,
      options
    });
    // Return empty data instead of throwing to prevent app crashes
    if (endpoint.includes('/attempts/current/stops_visited')) {
      return { data: [], page: 1, page_size: 20, total: 0, has_more: false };
    }
    throw error;
  }
}

export async function registerUser(unique_device_identifier: string) {
  try {
    console.log('Attempting to register user:', { unique_device_identifier });
    const result = await authenticatedFetch('/users', {
      method: "POST",
      body: JSON.stringify({ unique_device_identifier }),
    });
    console.log('User registration successful:', result);
    return result;
  } catch (error) {
    console.error('Failed to register user:', {
      error,
      message: error.message,
      stack: error.stack,
      deviceId: unique_device_identifier
    });
    // Don't throw - allow the app to continue even if registration fails
    return null;
  }
}

export async function startAttempt() {
  try {
    console.log('Starting new attempt...');
    // First get the user ID
    const deviceId = getDeviceId();
    console.log('Getting user ID for device:', deviceId);
    
    const user = await authenticatedFetch('/users', {
      method: "POST",
      body: JSON.stringify({ unique_device_identifier: deviceId }),
    });
    
    if (!user) {
      console.error('Failed to get user ID - no user returned');
      throw new Error('Failed to get user ID');
    }
    
    console.log('Got user ID, creating attempt:', { userId: user.id });
    // Then create the attempt
    const attempt = await authenticatedFetch('/attempts', {
      method: 'POST',
      body: JSON.stringify({ user_id: user.id })
    });
    
    console.log('Attempt created successfully:', attempt);

    // Get the initial journey for this attempt
    console.log('Fetching initial journey...');
    const journey = await authenticatedFetch('/attempts/current/journey');
    console.log('Initial journey fetched:', journey);
    
    return attempt;
  } catch (error) {
    console.error('Error starting attempt:', {
      error,
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
}

export async function endAttempt() {
  return authenticatedFetch('/attempts/current', {
    method: 'PATCH',
    body: JSON.stringify({ status: 'completed' })
  });
}

export async function getCurrentAttempt() {
  return authenticatedFetch('/attempts/current');
}

export async function markStopVisited(stop_id: string, visitedat: string) {
  return authenticatedFetch('/attempts/current/stops_visited', {
    method: 'POST',
    body: JSON.stringify({ stop_id, visited_at: visitedat }),
  });
}

export async function getVisitedStops() {
  return authenticatedFetch('/attempts/current/stops_visited');
}