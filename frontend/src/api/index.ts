import { API_BASE_URL } from "./config";

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
  const res = await fetch(`${API_BASE_URL}/attempts/${attemptId}/stops_visited`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ stop_id, visitedat }),
  });
  return res.json();
}

export async function getVisitedStops(attemptId: number) {
  const res = await fetch(`${API_BASE_URL}/attempts/${attemptId}/stops_visited`);
  return res.json();
}