import { API_BASE_URL } from "./config";
import { getDeviceId } from "../utils/deviceId";

async function authenticatedFetch(endpoint: string, options: RequestInit = {}) {
  const deviceId = getDeviceId();
  const headers = {
    "Content-Type": "application/json",
    "X-Device-ID": deviceId,
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }

  return response.json();
}

export async function registerUser(unique_device_identifier: string) {
  const res = await fetch(`${API_BASE_URL}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ unique_device_identifier }),
  });
  return res.json();
}

export async function startAttempt(user_id: number) {
  const res = await fetch(`${API_BASE_URL}/attempts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id }),
  });
  return res.json();
}

export async function markStopVisited(attemptId: number, stop_id: number, visitedat: string) {
  return authenticatedFetch(`/attempts/${attemptId}/stops_visited`, {
    method: "POST",
    body: JSON.stringify({ stop_id, visitedat }),
  });
}

export async function getVisitedStops(attemptId: number) {
  return authenticatedFetch(`/attempts/${attemptId}/stops_visited`);
}