import "../global.css";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { initializeDeviceId } from "../utils/deviceId";
import { registerUser } from "../api";

export default function Layout() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        // Initialize device ID (local storage only)
        const deviceId = await initializeDeviceId();
        
        // Try to register with backend, but don't fail if it doesn't work
        try {
          await registerUser(deviceId);
        } catch (err) {
          console.warn('Failed to register device with backend:', err);
          // Continue anyway - we can retry registration later
        }
        
        setIsInitialized(true);
      } catch (err) {
        console.error('Failed to initialize device ID:', err);
        setError('Failed to initialize app. Please try again.');
      }
    }
    init();
  }, []);

  if (error) {
    return (
      <View className="flex-1 justify-center items-center p-4">
        <Text className="text-red-500 text-center">{error}</Text>
      </View>
    );
  }

  if (!isInitialized) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#007AFF",
        tabBarInactiveTintColor: "#8E8E93",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: "#E5E5EA",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "My Trip",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="train-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: "Map",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
