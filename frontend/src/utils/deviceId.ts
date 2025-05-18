import * as SecureStore from 'expo-secure-store';
import { v4 as uuidv4 } from 'uuid';

const DEVICE_ID_KEY = 'device_id';

// Global variable to store the device ID
let deviceId: string | null = null;

export async function initializeDeviceId(): Promise<string> {
  try {
    // First try to get existing device ID from secure storage
    let storedId = await SecureStore.getItemAsync(DEVICE_ID_KEY);
    
    if (!storedId) {
      // Generate new UUID if none exists
      storedId = uuidv4();
      // Store it securely
      await SecureStore.setItemAsync(DEVICE_ID_KEY, storedId);
    }
    
    // Store the ID in memory
    deviceId = storedId;
    
    return storedId;
  } catch (error) {
    console.error('Error initializing device ID:', error);
    throw error;
  }
}

export function getDeviceId(): string {
  if (!deviceId) {
    throw new Error('Device ID not initialized. Call initializeDeviceId() first.');
  }
  return deviceId;
}

export async function clearDeviceId(): Promise<void> {
  await SecureStore.deleteItemAsync(DEVICE_ID_KEY);
  deviceId = null;
} 