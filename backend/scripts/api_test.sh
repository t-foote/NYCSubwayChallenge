#!/bin/bash
# API Test Suite for NYC Subway Challenge Backend
# Usage: bash scripts/api_test.sh
# Requires: curl, jq (optional for pretty-print)

API_URL="http://localhost:3000"
DEVICE_ID="test-device-123"
STOP_IDS=(131 130 129) 

# set -e

print_json() {
  if command -v jq &> /dev/null; then
    jq .
  else
    cat
  fi
}

echo "\n--- Registering user ---"
USER=$(curl -s -X POST "$API_URL/users" \
  -H "Content-Type: application/json" \
  -d '{"unique_device_identifier": "'$DEVICE_ID'"}')
echo "$USER" | print_json
USER_ID=$(echo "$USER" | jq -r '.id')
if [ "$USER_ID" == "null" ] || [ -z "$USER_ID" ]; then
  echo "User registration failed" >&2; exit 1; fi

echo "\n--- Starting attempt ---"
ATTEMPT=$(curl -s -X POST "$API_URL/attempts" \
  -H "Content-Type: application/json" \
  -d '{"user_id": '$USER_ID'}')
echo "$ATTEMPT" | print_json
ATTEMPT_ID=$(echo "$ATTEMPT" | jq -r '.id')
if [ "$ATTEMPT_ID" == "null" ] || [ -z "$ATTEMPT_ID" ]; then
  echo "Attempt creation failed" >&2; exit 1; fi

echo "\n--- Getting attempt details ---"
curl -s "$API_URL/attempts/$ATTEMPT_ID" | print_json

echo "\n--- Marking stops as visited ---"
for STOP_ID in "${STOP_IDS[@]}"; do
  VISIT_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  VISITED=$(curl -s -X POST "$API_URL/attempts/$ATTEMPT_ID/stops_visited" \
    -H "Content-Type: application/json" \
    -d '{"stop_id": '$STOP_ID', "visitedat": "'$VISIT_TIME'"}')
  echo "Stop $STOP_ID visit response:"; echo "$VISITED" | print_json
  sleep 1 # Ensure unique timestamps
  if [ "$(echo "$VISITED" | jq -r '.id')" == "null" ]; then
    echo "Marking stop $STOP_ID as visited failed" >&2; exit 1; fi
done

echo "\n--- Getting all visited stops ---"
curl -s "$API_URL/attempts/$ATTEMPT_ID/stops_visited" | print_json

echo "\n--- Ending attempt ---"
END=$(curl -s -X PATCH "$API_URL/attempts/$ATTEMPT_ID")
echo "$END" | print_json
if [ "$(echo "$END" | jq -r '.ended_at')" == "null" ]; then
  echo "Ending attempt failed" >&2; exit 1; fi

echo "\nAll API tests completed successfully." 