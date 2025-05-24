import Constants from 'expo-constants';

// API base URL for backend requests
// Set REACT_NATIVE_API_BASE_URL in your .env or app.config.js
// Example: REACT_NATIVE_API_BASE_URL="http://192.168.x.x:3000"

export const API_BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl || "http://localhost:3000";