import { Link } from "expo-router";
import React, { useEffect, useState } from "react";
import { Text, View, TouchableOpacity, FlatList, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
// @ts-ignore
import * as SecureStore from 'expo-secure-store';
import { registerUser, startAttempt, markStopVisited, getVisitedStops } from "../api/index";

const DEVICE_ID_KEY = 'device_id';

async function getOrCreateDeviceId() {
  let id = await SecureStore.getItemAsync(DEVICE_ID_KEY);
  if (!id) {
    id = Math.random().toString(36).substring(2) + Date.now().toString(36);
    await SecureStore.setItemAsync(DEVICE_ID_KEY, id);
  }
  return id;
}

export default function Page() {
  const [visitedStops, setVisitedStops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [stops, setStops] = useState([]);
  const [selectedStop, setSelectedStop] = useState(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      // 1. Get or create device ID
      const deviceId = await getOrCreateDeviceId();
      // 2. Register user
      const userObj = await registerUser(deviceId);
      setUser(userObj);
      // 3. Start attempt
      const attemptObj = await startAttempt(userObj.id);
      setAttempt(attemptObj);
      // 4. Fetch stops for picker
      const stopsRes = await fetch('/stops'); // TODO: Replace with real API call
      const stopsList = await stopsRes.json();
      setStops(stopsList);
      // 5. Fetch visited stops
      await loadStops(attemptObj.id);
      setLoading(false);
    })();
  }, []);

  async function loadStops(attemptId) {
    setLoading(true);
    const stops = await getVisitedStops(attemptId);
    setVisitedStops(stops);
    setLoading(false);
  }

  async function handleVisitStop() {
    if (!selectedStop || !attempt) return;
    setSyncing(true);
    const now = new Date().toISOString();
    await markStopVisited(attempt.id, selectedStop, now);
    await loadStops(attempt.id);
    setSyncing(false);
  }

  if (loading) {
    return <View className="flex-1 justify-center items-center"><ActivityIndicator size="large" /></View>;
  }

  return (
    <View className="flex flex-1">
      <Content
        visitedStops={visitedStops}
        stops={stops}
        selectedStop={selectedStop}
        setSelectedStop={setSelectedStop}
        onVisitStop={handleVisitStop}
        syncing={syncing}
      />
      <Footer />
    </View>
  );
}

function Content({ visitedStops, stops, selectedStop, setSelectedStop, onVisitStop, syncing }) {
  const insets = useSafeAreaInsets();
  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      <FlatList
        data={visitedStops}
        keyExtractor={item => item.id?.toString() || Math.random().toString()}
        contentContainerStyle={{ paddingBottom: 32, paddingHorizontal: 20 }}
        ListHeaderComponent={
          <>
            <Text className="text-3xl font-bold mt-4 mb-4 text-gray-800">
              NYC Subway Challenge
            </Text>

            <View className="bg-white rounded-2xl p-5 mb-6 shadow-sm">
              <Text className="text-lg font-semibold mb-3 text-gray-800">
                Trip in Progress
              </Text>
              <View className="flex-row justify-between">
                <Text className="text-gray-600">
                  <Text className="font-bold text-gray-800">{visitedStops.length}</Text> Stops Visited
                </Text>
                <Text className="text-gray-600">
                  <Text className="font-bold text-gray-800">{470 - visitedStops.length}</Text> Stops Left
                </Text>
                <Text className="text-gray-600">
                  <Text className="font-bold text-gray-800">00:12</Text> Elapsed
                </Text>
              </View>
            </View>

            <Text className="text-xl font-bold mb-2 text-gray-800">
              Visited Stops
            </Text>
            <View className="mb-4">
              <Text className="mb-2">Select a stop to mark as visited:</Text>
              <View style={{ backgroundColor: 'white', borderRadius: 8, padding: 8 }}>
                <select
                  value={selectedStop || ''}
                  onChange={e => setSelectedStop(e.target.value)}
                  style={{ width: '100%', padding: 8, borderRadius: 8 }}
                >
                  <option value="" disabled>Select a stop...</option>
                  {stops.map(stop => (
                    <option key={stop.id} value={stop.id}>{stop.stop_name}</option>
                  ))}
                </select>
              </View>
            </View>
          </>
        }
        renderItem={({ item }) => (
          <View className="bg-white rounded-xl py-4 px-5 mb-3 flex-row justify-between items-center shadow-sm">
            <Text className="text-base font-semibold text-gray-800 flex-1">
              {item.stop_name || item.name || item.stop_id}
            </Text>
            <Text className="text-sm text-gray-500 ml-4 min-w-[70px] text-right">
              {item.visitedat ? new Date(item.visitedat).toLocaleTimeString() : ''}
            </Text>
          </View>
        )}
        ListFooterComponent={
          <TouchableOpacity
            className="bg-blue-600 rounded-2xl mt-6 py-[18px] items-center"
            onPress={onVisitStop}
            disabled={!selectedStop || syncing}
          >
            <Text className="text-lg font-bold text-white tracking-wide">
              {syncing ? 'Syncing...' : 'Mark Stop as Visited'}
            </Text>
          </TouchableOpacity>
        }
      />
    </View>
  );
}

function Footer() {
  const { bottom } = useSafeAreaInsets();
  return (
    <View
      className="flex shrink-0 bg-gray-100 native:hidden"
      style={{ paddingBottom: bottom }}
    >
      <View className="py-6 flex-1 items-start px-4 md:px-6">
        <Text className={"text-center text-gray-700"}>
          © {new Date().getFullYear()} NYC Subway Challenge
        </Text>
      </View>
    </View>
  );
}
