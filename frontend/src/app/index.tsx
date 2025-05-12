import { Link } from "expo-router";
import React, { useEffect, useState } from "react";
import { Text, View, TouchableOpacity, FlatList } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getVisitedStops, addVisitedStop, syncPendingStops } from "../sqlite/visitedStops";

export default function Page() {
  const [visitedStops, setVisitedStops] = useState<Array<{ id: string; name: string; time: string; pending: boolean }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStops();
    const interval = setInterval(() => {
      syncPendingStops().then(loadStops);
    }, 10000); // Try syncing every 10s
    return () => clearInterval(interval);
  }, []);

  async function loadStops() {
    setLoading(true);
    console.log('loadStops: starting load');
    const stops = await getVisitedStops();
    console.log('loadStops: got stops', stops);
    setVisitedStops(stops);
    setLoading(false);
    console.log('loadStops: finished');
  }

  async function handleVisitStop() {
    // For demo, just add a fake stop
    await addVisitedStop({
      id: Date.now().toString(),
      name: `Demo Stop ${visitedStops.length + 1}`,
      time: new Date().toLocaleTimeString(),
    });
    loadStops();
  }

  return (
    <View className="flex flex-1">
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <Text>Loading...</Text>
        </View>
      ) : (
        <Content visitedStops={visitedStops} loading={loading} onVisitStop={handleVisitStop} />
      )}
      <Footer />
    </View>
  );
}

function Content({ visitedStops, loading, onVisitStop }: { visitedStops: Array<{ id: string; name: string; time: string; pending: boolean }>; loading: boolean; onVisitStop: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      <FlatList
        data={visitedStops}
        keyExtractor={item => item.id}
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
                  <Text className="font-bold text-gray-800">470</Text> Stops Left
                </Text>
                <Text className="text-gray-600">
                  <Text className="font-bold text-gray-800">00:12</Text> Elapsed
                </Text>
              </View>
            </View>

            <Text className="text-xl font-bold mb-2 text-gray-800">
              Visited Stops
            </Text>
          </>
        }
        renderItem={({ item }) => (
          <View className="bg-white rounded-xl py-4 px-5 mb-3 flex-row justify-between items-center shadow-sm">
            <Text className="text-base font-semibold text-gray-800 flex-1">
              {item.name}
            </Text>
            <Text className="text-sm text-gray-500 ml-4 min-w-[70px] text-right">
              {item.time}
            </Text>
            {item.pending && (
              <Text className="text-xs text-orange-500 ml-2">Pending Sync</Text>
            )}
          </View>
        )}
        ListFooterComponent={
          <TouchableOpacity className="bg-blue-600 rounded-2xl mt-6 py-[18px] items-center" onPress={onVisitStop}>
            <Text className="text-lg font-bold text-white tracking-wide">
              Mark Stop as Visited
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
